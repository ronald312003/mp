// ============================================================
//  Búsqueda de imágenes reales de producto.
//  Cuando no se puede obtener la foto desde la tienda de origen,
//  se busca en internet (Bing Images) y se toma la primera imagen
//  real más cercana. Funciona en Node (scripts) y en el runtime del
//  servidor (alta de producto en /admin).
// ============================================================

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

function decodeEntities(s) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/\\u002f/gi, "/")
    .replace(/\\\//g, "/");
}

// Hosts que suelen bloquear hotlink o dar imágenes poco útiles.
const BAD_HOST = /(lookaside|fbsbx|instagram|pinimg\.com\/originals\/\w{2}\/\w{2}\/\w{2}\/)/i;

async function bingImages(query) {
  return (await bingImageRecords(query)).map((record) => record.imageUrl);
}

async function bingImageRecords(query) {
  const url =
    "https://www.bing.com/images/search?q=" +
    encodeURIComponent(query) +
    "&form=HDRSC2&first=1&safeSearch=off";
  const res = await fetch(url, {
    headers: { "user-agent": UA, "accept-language": "en-US,en;q=0.9" },
    signal: AbortSignal.timeout(15000)
  });
  if (!res.ok) return [];
  const html = await res.text();
  const records = [];
  // Bing ha cambiado varias veces el atributo que sigue a `m`. Leerlo desde
  // el anchor `iusc` evita depender de `data-*` y conserva purl/título para
  // poder verificar que la página corresponde al modelo exacto.
  for (const match of html.matchAll(/class="iusc"[^>]*\sm="([^"]+)"/g)) {
    try {
      const item = JSON.parse(decodeEntities(match[1]));
      if (item?.murl) records.push({
        imageUrl: String(item.murl),
        pageUrl: String(item.purl || ""),
        title: String(item.t || ""),
        description: String(item.desc || "")
      });
    } catch {}
  }
  if (records.length) return records;

  // Respaldo para cambios menores de marcado en Bing.
  return [...html.matchAll(/murl&quot;:&quot;(https?:\/\/[^&]+?)&quot;/g)].map((match) => ({
    imageUrl: decodeEntities(match[1]), pageUrl: "", title: "", description: ""
  }));
}

async function isImage(url) {
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: { "user-agent": UA, range: "bytes=0-2048" },
      signal: AbortSignal.timeout(10000)
    });
    const ct = res.headers.get("content-type") || "";
    return res.ok && ct.startsWith("image/");
  } catch {
    return false;
  }
}

/**
 * Devuelve la URL de una imagen real para la consulta dada, o null.
 * @param {string} query  p.ej. "Saint Laurent grain de poudre wool blazer"
 * @param {object} [opts]
 * @param {boolean} [opts.verify=true] comprobar que la URL sirve una imagen
 */
export async function searchProductImage(query, opts = {}) {
  return (await searchProductImages(query, { ...opts, limit: 1 }))[0] || null;
}

/**
 * Devuelve varias imágenes verificadas y distintas para una consulta.
 * @param {string} query
 * @param {object} [opts]
 * @param {boolean} [opts.verify=true]
 * @param {number} [opts.limit=4]
 */
export async function searchProductImages(query, opts = {}) {
  const verify = opts.verify !== false;
  const limit = Math.max(1, Number(opts.limit || 4));
  let candidates = [];
  try {
    candidates = await bingImages(query);
  } catch {
    return [];
  }
  candidates = [...new Set(candidates)].filter(
    (u) => /^https:\/\//.test(u) && !BAD_HOST.test(u)
  );

  const found = [];
  for (const url of candidates.slice(0, 16)) {
    if (!verify || (await isImage(url))) found.push(url);
    if (found.length >= limit) break;
  }
  return found;
}

const compact = (value) => String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "");

/**
 * Busca medios con evidencia verificable del identificador exacto. El modelo o
 * GTIN debe aparecer en la URL de la imagen, página origen, título o descripción
 * del resultado. Esto descarta variantes sugeridas por similitud visual.
 */
export async function searchExactProductMedia(query, identifier, opts = {}) {
  const limit = Math.max(1, Number(opts.limit || 6));
  const needle = compact(identifier);
  if (needle.length < 5) return [];

  let records = [];
  try {
    records = await bingImageRecords(query);
  } catch {
    return [];
  }

  const seen = new Set();
  const candidates = records.filter((record) => {
    if (!/^https:\/\//.test(record.imageUrl) || BAD_HOST.test(record.imageUrl)) return false;
    // La página puede contener carruseles de productos relacionados. Para el
    // fallback comercial exigimos que el código aparezca en la imagen misma;
    // las URLs sin código solo se aceptan en los extractores del fabricante.
    if (!compact(record.imageUrl).includes(needle) || seen.has(record.imageUrl)) return false;
    seen.add(record.imageUrl);
    return true;
  }).slice(0, 24);

  const checked = await Promise.all(candidates.map(async (record) =>
    (await isImage(record.imageUrl)) ? record : null
  ));
  return checked.filter(Boolean).slice(0, limit);
}

/**
 * Respaldo para productos escasos: acepta la imagen principal indexada de una
 * página que declara el GTIN/modelo exacto, siempre que la URL de imagen no
 * contenga otro GTIN distinto. Se usa solo para llegar a tres vistas.
 */
export async function searchExactProductPageMedia(query, identifier, brand, opts = {}) {
  const limit = Math.max(1, Number(opts.limit || 4));
  const needle = compact(identifier);
  let records = [];
  try { records = await bingImageRecords(query); } catch { return []; }
  const seen = new Set();
  const candidates = records.filter((record) => {
    if (!/^https:\/\//.test(record.imageUrl) || BAD_HOST.test(record.imageUrl)) return false;
    const pageEvidence = compact(`${record.pageUrl} ${record.title} ${record.description}`);
    if (!pageEvidence.includes(needle) || !pageEvidence.includes(compact(brand))) return false;
    if (compact(record.imageUrl).includes(needle)) return false; // ya está en la capa estricta
    const foreignGtins = record.imageUrl.match(/\d{12,14}/g) || [];
    if (foreignGtins.length) return false;
    if (seen.has(record.imageUrl)) return false;
    seen.add(record.imageUrl);
    return true;
  }).slice(0, 18);
  const checked = await Promise.all(candidates.map(async (record) =>
    (await isImage(record.imageUrl)) ? record : null
  ));
  return checked.filter(Boolean).slice(0, limit);
}
