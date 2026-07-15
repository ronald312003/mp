import "./load-env.mjs";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { searchExactProductMedia, searchExactProductPageMedia } from "../lib/image-search.mjs";
import { buildSeedSql } from "./seed-sql.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const MEDIA_PATH = resolve(ROOT, "data/exact-product-media.json");
const CURATED_MEDIA_PATH = resolve(ROOT, "data/curated-product-media.json");
const WATCH_MEDIA_PATH = resolve(ROOT, "data/watch-official-media.json");
const OFFICIAL_MEDIA_PATH = resolve(ROOT, "data/official-product-media.json");
const MAX_IMAGES = 7;

const readMedia = () => {
  try { return JSON.parse(readFileSync(MEDIA_PATH, "utf8")); } catch { return {}; }
};
const readCuratedMedia = () => {
  try { return JSON.parse(readFileSync(CURATED_MEDIA_PATH, "utf8")); } catch { return {}; }
};
const compact = (value) => String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "");

function imageIdentity(value) {
  try {
    const url = new URL(value);
    if (/\.jomashop\.com$/i.test(url.hostname)) {
      url.pathname = url.pathname.replace(/\/media\/catalog\/product\/cache\/[^/]+\//i, "/media/catalog/product/");
      url.search = "";
    }
    return url.toString();
  } catch {
    return String(value || "");
  }
}

function uniqueImages(values) {
  const seen = new Set();
  return values.filter((value) => {
    if (!value) return false;
    const key = imageIdentity(value);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function identifierOf(product) {
  const sourceId = String(product.sourceId || "").toUpperCase();
  if (product.type === "watch") {
    if (product.brand === "Citizen") return sourceId.replace(/^CZ/, "");
    if (product.brand === "Tissot") return sourceId.match(/T\d{8,13}/)?.[0] || null;
    if (product.brand === "Seiko") return sourceId.replace(/^SE-/, "");
  }
  if (product.type === "perfume") {
    // Los proveedores suelen pegar el GTIN a guiones bajos o sufijos de
    // archivo. Los límites de palabra no lo detectan porque "_" cuenta como
    // carácter de palabra; lo único que debe delimitarlo son otros dígitos.
    return `${product.sourceUrl || ""} ${product.imageUrl || ""}`.match(/(?<!\d)\d{12,14}(?!\d)/g)?.at(-1) || null;
  }
  return null;
}

async function pool(items, size, task) {
  const queue = [...items];
  await Promise.all(Array.from({ length: size }, async () => {
    while (queue.length) await task(queue.shift());
  }));
}

export function attachExactProductMedia(products, media = readMedia()) {
  const curated = readCuratedMedia();
  let attached = 0;
  for (const product of products) {
    const entry = media[String(product.sourceId)];
    const curatedEntry = curated[String(product.sourceId)];
    const identifier = identifierOf(product);
    if (!identifier) continue;
    const before = (product.images || []).length;
    const exact = entry?.identifier === identifier ? (entry.images || []) : [];
    const supplemental = entry?.identifier === identifier
      ? (entry.supplemental || []).map((item) => item.imageUrl).filter(Boolean)
      : [];
    const reviewed = curatedEntry?.identifier === identifier ? (curatedEntry.images || []) : [];
    // Las selecciones revisadas manualmente tienen prioridad sobre hallazgos
    // antiguos o CDNs inestables, conservando siempre la imagen principal.
    product.images = uniqueImages([product.imageUrl, ...reviewed, ...(product.images || []), ...exact, ...supplemental]).slice(0, MAX_IMAGES);
    if (product.images.length > before) attached++;
  }
  console.log(`  · búsqueda exacta: ${attached} galerías ampliadas desde manifiesto`);
  return attached;
}

/** Elimina resultados relacionados que una búsqueda anterior pudo asociar a
 * una página correcta. Conserva explícitamente los medios del fabricante. */
export function sanitizeExactProductMedia(products, media) {
  let watchOfficial = {};
  let productOfficial = {};
  try { watchOfficial = JSON.parse(readFileSync(WATCH_MEDIA_PATH, "utf8")); } catch {}
  try { productOfficial = JSON.parse(readFileSync(OFFICIAL_MEDIA_PATH, "utf8")); } catch {}
  let removed = 0;

  for (const product of products) {
    const entry = media[String(product.sourceId)];
    const identifier = identifierOf(product);
    if (!entry || !identifier) continue;
    const discovered = new Set(entry.images || []);
    const exact = (entry.images || []).filter((url) => compact(url).includes(compact(identifier)));
    const exactSet = new Set(exact);
    const trusted = new Set([product.imageUrl]);
    const officialWatch = watchOfficial[identifier];
    if (officialWatch?.brand === product.brand) {
      for (const url of officialWatch.images || []) trusted.add(url);
      if (officialWatch.technicalImage) trusted.add(officialWatch.technicalImage);
    }
    const officialProduct = productOfficial[String(product.sourceId)];
    if (officialProduct?.brand === product.brand) {
      for (const url of officialProduct.images || []) trusted.add(url);
    }

    product.images = (product.images || []).filter((url) => {
      const keep = !discovered.has(url) || exactSet.has(url) || trusted.has(url);
      if (!keep) removed++;
      return keep;
    });
    entry.images = exact;
    entry.evidencePages = (entry.evidencePages || []).filter((url) =>
      compact(url).includes(compact(identifier))
    );
    entry.supplemental = (entry.supplemental || []).filter((item) => {
      if (!item?.imageUrl || !item?.pageUrl) return false;
      const evidence = compact(`${item.pageUrl} ${item.title || ""}`);
      if (!evidence.includes(compact(identifier)) || !evidence.includes(compact(product.brand))) return false;
      if ((item.imageUrl.match(/\d{12,14}/g) || []).length) return false;
      return true;
    });
  }
  if (removed) console.log(`  · depuración exacta: ${removed} imágenes relacionadas descartadas`);
  return removed;
}

export async function enrichExactProductMedia(products) {
  const media = readMedia();
  sanitizeExactProductMedia(products, media);
  const candidates = products
    .filter((product) => product.type === "watch" || product.type === "perfume")
    .map((product) => ({ product, identifier: identifierOf(product) }))
    .filter((entry) => entry.identifier);
  const force = process.env.EXACT_MEDIA_FORCE === "1";
  const pending = candidates.filter(({ product, identifier }) =>
    force || media[String(product.sourceId)]?.identifier !== identifier
  );
  const limit = Math.max(0, Number(process.env.EXACT_MEDIA_LIMIT || 0));
  const selected = limit ? pending.slice(0, limit) : pending;
  const concurrency = Math.min(6, Math.max(1, Number(process.env.EXACT_MEDIA_CONCURRENCY || 4)));
  let done = 0;
  let withMedia = 0;

  await pool(selected, concurrency, async ({ product, identifier }) => {
    const query = `"${identifier}" ${product.brand} ${product.name}`.slice(0, 180);
    const found = await searchExactProductMedia(query, identifier, { limit: 6 });
    media[String(product.sourceId)] = {
      identifier,
      brand: product.brand,
      type: product.type,
      query,
      images: found.map((item) => item.imageUrl),
      evidencePages: [...new Set(found.map((item) => item.pageUrl).filter(Boolean))],
      verifiedAt: new Date().toISOString()
    };
    done++;
    if (found.length) withMedia++;
    if (done % 12 === 0) {
      writeFileSync(MEDIA_PATH, JSON.stringify(media, null, 2), "utf8");
      process.stdout.write(`\r  · búsqueda exacta ${done}/${selected.length}   `);
    }
  });
  if (done) process.stdout.write("\n");
  attachExactProductMedia(products, media);

  // Solo las galerías que siguen por debajo de tres vistas usan evidencia de
  // página exacta. Esta capa nunca rellena productos que ya tienen cobertura.
  const sparse = candidates.filter(({ product }) => (product.images || []).length < 3);
  let supplemented = 0;
  await pool(sparse, Math.min(3, concurrency), async ({ product, identifier }) => {
    const entry = media[String(product.sourceId)] || { identifier, brand: product.brand, type: product.type, images: [] };
    if (!entry.supplemental?.length || force) {
      const query = `"${identifier}" ${product.brand} ${product.name}`.slice(0, 180);
      const found = await searchExactProductPageMedia(query, identifier, product.brand, { limit: 4 });
      entry.supplemental = found.map((item) => ({ imageUrl: item.imageUrl, pageUrl: item.pageUrl, title: item.title }));
      media[String(product.sourceId)] = entry;
    }
    const before = product.images.length;
    const needed = Math.max(0, 3 - before);
    product.images = uniqueImages([...product.images, ...(entry.supplemental || []).slice(0, needed).map((item) => item.imageUrl)]).slice(0, MAX_IMAGES);
    if (product.images.length > before) supplemented++;
  });
  if (sparse.length) console.log(`  · páginas con GTIN/modelo exacto: ${supplemented}/${sparse.length} galerías completadas`);

  writeFileSync(MEDIA_PATH, JSON.stringify(media, null, 2), "utf8");
  attachExactProductMedia(products, media);
  console.log(`  · descubrimiento: ${withMedia}/${selected.length} referencias con resultados exactos`);
  return media;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const catalogPath = resolve(ROOT, "data/catalog.json");
  const seedPath = resolve(ROOT, "db/seed.sql");
  const catalog = JSON.parse(readFileSync(catalogPath, "utf8"));
  await enrichExactProductMedia(catalog.products);
  catalog.generatedAt = new Date().toISOString();
  writeFileSync(catalogPath, JSON.stringify(catalog, null, 2), "utf8");
  writeFileSync(seedPath, buildSeedSql(catalog), "utf8");
  console.log("✓ data/catalog.json y db/seed.sql sincronizados");
}
