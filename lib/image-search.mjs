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
  const urls = [...html.matchAll(/murl&quot;:&quot;(https?:\/\/[^&]+?)&quot;/g)].map((m) =>
    decodeEntities(m[1])
  );
  return urls;
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
