// ============================================================
//  TheOutnet (ropa + zapatos de diseñador) — PRODUCTOS REALES
//
//  La sección /mens expone JSON-LD con productos, precio e imágenes, pero
//  Akamai puede bloquearla de forma intermitente. Se combina entonces:
//   1) lectura directa y caché de /mens;
//   2) snapshot versionado de URLs masculinas oficiales;
//   3) sitemaps para conservar el catálogo femenino.
//
//  Las imágenes siempre salen del CDN oficial por partNumber. Si el JSON-LD
//  no está disponible, el precio outlet se estima de forma determinista.
// ============================================================

import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import {
  OUTNET_SITEMAPS_CLOTHING,
  OUTNET_SITEMAPS_SHOES,
  OUTNET_BRANDS,
  OUTNET_PER_BRAND,
  OUTNET_MEN_CLOTHING_PAGES,
  OUTNET_MEN_SHOES_PAGES,
  OUTNET_MEN_CLOTHING_LIMIT,
  OUTNET_MEN_SHOES_LIMIT
} from "./config.mjs";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";
const H = { "user-agent": UA };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchSitemap(name) {
  let lastError;
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const r = await fetch("https://www.theoutnet.com/" + name, {
        headers: H,
        signal: AbortSignal.timeout(15000)
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const t = await r.text();
      return [...t.matchAll(/<loc>([^<]+)<\/loc>/g)]
        .map((m) => m[1])
        .filter((url) => url.startsWith("https://www.theoutnet.com/en-us/shop/product/"));
    } catch (error) {
      lastError = error;
      if (attempt < 2) await sleep(1000 * attempt);
    }
  }
  console.warn(`  ! TheOutnet ${name}: ${lastError?.message || "sin respuesta"}`);
  return [];
}

// Parsea una URL de producto:
//  /en-us/shop/product/{brand}/{cat1}/{cat2?}/{name-slug}/{partNumber}
function parseProductUrl(url) {
  const m = url.match(/\/shop\/product\/([^/]+)\/(.+)\/(\d{6,})$/);
  if (!m) return null;
  const brandSlug = decodeURIComponent(m[1]).toLowerCase();
  const rest = m[2].split("/");
  const nameSlug = rest[rest.length - 1];
  const cat = rest.slice(0, -1).join(" ");
  return { brandSlug, cat, nameSlug, partNumber: m[3], url };
}

function matchBrand(brandSlug) {
  for (const b of OUTNET_BRANDS) {
    if (b.match.some((s) => brandSlug === s || brandSlug.startsWith(s))) return b;
  }
  return null;
}

function titleCase(slug) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((w) => (w.length <= 2 ? w : w[0].toUpperCase() + w.slice(1)))
    .join(" ");
}

function inferGender(text, fallback = "women") {
  const t = text.toLowerCase();
  if (/\b(men|mens|man|male|tuxedo|boxer|briefs)\b/.test(t)) return "men";
  if (/\b(dress|gown|skirt|blouse|bodysuit|bra|lingerie|jumpsuit|playsuit|ballet|pump|heel|espadrille)\b/.test(t))
    return "women";
  return fallback;
}

// Estimación de precio base (USD) en rango outlet, según tipo/categoría/marca.
const TIER = {
  "Saint Laurent": 1.25, Valentino: 1.2, "Alexander McQueen": 1.18, "Maison Margiela": 1.12,
  Balmain: 1.15, Versace: 1.1, "Dolce & Gabbana": 1.1, Ferragamo: 1.05, "Jimmy Choo": 1.05,
  "Ralph Lauren": 0.85
};
function priceRange(cat, name, type) {
  const t = (cat + " " + name).toLowerCase();
  if (type === "shoes") {
    if (/sneaker|trainer/.test(t)) return [250, 480];
    if (/boot/.test(t)) return [350, 720];
    return [240, 620]; // heels, pumps, sandals, flats, loafers
  }
  if (/gown/.test(t)) return [400, 780];
  if (/dress/.test(t)) return [250, 650];
  if (/coat|parka|trench/.test(t)) return [420, 790];
  if (/blazer|jacket|suit/.test(t)) return [340, 720];
  if (/knit|sweater|cardigan|jumper|cashmere/.test(t)) return [180, 420];
  if (/t-shirt|tee|tank|top|polo|shirt|blouse/.test(t)) return [110, 320];
  if (/jean|trouser|pant|skirt|short|legging/.test(t)) return [150, 400];
  if (/bag|tote|clutch|shoulder/.test(t)) return [300, 780];
  return [160, 480];
}
function estimatePrice(cat, name, type, brand, pn) {
  const [lo, hi] = priceRange(cat, name, type);
  // pseudo-aleatorio determinista a partir del partNumber
  let h = 0;
  for (let i = 0; i < pn.length; i++) h = (h * 31 + pn.charCodeAt(i)) >>> 0;
  const frac = (h % 1000) / 1000;
  let price = lo + frac * (hi - lo);
  price *= TIER[brand] ?? 1;
  return Math.round(price);
}

async function imageOk(url) {
  try {
    const r = await fetch(url, { headers: H, signal: AbortSignal.timeout(8000) });
    return r.ok && (r.headers.get("content-type") || "").startsWith("image/");
  } catch {
    return false;
  }
}
// CDN actual de TheOutnet. F es la vista frontal limpia; D/E/N son detalles
// y R/Q son vistas editoriales alternativas (según el producto existe una).
const outnetImage = (pn, view = "F") =>
  `https://www.theoutnet.com/variants/images/${pn}/${view}/w1020_q80.jpg`;

// ---------- Catálogo masculino oficial (/mens) ----------
// Estas páginas contienen JSON-LD con 96 productos, precio outlet e imágenes.
// Akamai es sensible al fingerprint: un UA mínimo funciona mejor que fingir un
// Chrome completo. Cada página válida queda cacheada como respaldo.
const MEN_UA = "Mozilla/5.0";
const CACHE_DIR = resolve(fileURLToPath(new URL(".", import.meta.url)), ".cache");
const MEN_SNAPSHOT_PATH = resolve(
  fileURLToPath(new URL(".", import.meta.url)),
  "../data/outnet-men-snapshot.json"
);

async function fetchMensPage(kind, page) {
  mkdirSync(CACHE_DIR, { recursive: true });
  const cachePath = resolve(CACHE_DIR, `outnet-men-${kind}-${page}.html`);
  for (let attempt = 1; attempt <= 2; attempt++) {
    const params = new URLSearchParams({
      pageNumber: String(page),
      cm_sp: `catalog-men-${kind}`,
      refresh: `${Date.now()}-${attempt}`
    });
    try {
      const response = await fetch(
        `https://www.theoutnet.com/en-us/shop/mens/${kind}?${params}`,
        {
          headers: { "user-agent": MEN_UA, "accept-language": "en-US,en;q=0.9" },
          signal: AbortSignal.timeout(12000)
        }
      );
      const html = await response.text();
      if (response.ok && html.length > 100000 && html.includes('"itemListElement"')) {
        writeFileSync(cachePath, html, "utf8");
        return html;
      }
    } catch {}
    if (attempt < 2) await sleep(700 * attempt);
  }
  if (existsSync(cachePath)) {
    console.warn(`  ! TheOutnet /mens/${kind} página ${page}: usando caché verificada`);
    return readFileSync(cachePath, "utf8");
  }
  console.warn(`  ! TheOutnet /mens/${kind} página ${page}: bloqueada y sin caché`);
  return "";
}

function extractJsonArray(html, marker) {
  const markerAt = html.indexOf(`"${marker}"`);
  if (markerAt < 0) return [];
  const start = html.indexOf("[", markerAt);
  if (start < 0) return [];
  let depth = 0, quoted = false, escaped = false;
  for (let i = start; i < html.length; i++) {
    const ch = html[i];
    if (quoted) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') quoted = false;
      continue;
    }
    if (ch === '"') quoted = true;
    else if (ch === "[") depth++;
    else if (ch === "]" && --depth === 0) {
      try { return JSON.parse(html.slice(start, i + 1)); } catch { return []; }
    }
  }
  return [];
}

const BRAND_NAMES = {
  "OFF-WHITE™": "Off-White",
  "FRESCOBOL CARIOCA": "Frescobol Carioca",
  "ORLEBAR BROWN": "Orlebar Brown",
  "THOM BROWNE": "Thom Browne",
  "TOM FORD": "Tom Ford",
  "MR P.": "MR P.",
  "RAG & BONE": "Rag & Bone",
  "PAUL SMITH": "Paul Smith",
  "THE ELDER STATESMAN": "The Elder Statesman"
};

function displayBrand(value = "") {
  if (BRAND_NAMES[value]) return BRAND_NAMES[value];
  if (value !== value.toUpperCase()) return value;
  return value.toLowerCase().replace(/(^|[\s-])\p{L}/gu, (m) => m.toUpperCase());
}

const SLUG_BRAND_NAMES = {
  "acne-studios": "Acne Studios",
  "alex-mill": "Alex Mill",
  "fear-of-god-essentials": "Fear of God Essentials",
  "frescobol-carioca": "Frescobol Carioca",
  "gianvito-rossi": "Gianvito Rossi",
  "jil-sander": "Jil Sander",
  "mr-p": "MR P.",
  "new-balance": "New Balance",
  "off-white™": "Off-White",
  "officine-generale": "Officine Générale",
  "orlebar-brown": "Orlebar Brown",
  "paul-smith": "Paul Smith",
  "rag-bone": "Rag & Bone",
  "the-elder-statesman": "The Elder Statesman",
  "thom-browne": "Thom Browne",
  "tod-s": "Tod's",
  "tom-ford": "Tom Ford"
};

function brandFromSlug(value = "") {
  let slug = value;
  try { slug = decodeURIComponent(value); } catch {}
  slug = slug.toLowerCase();
  return SLUG_BRAND_NAMES[slug] || titleCase(slug);
}

// Respaldo versionado de URLs masculinas verificadas en las páginas oficiales.
// Evita que un challenge temporal de Akamai reduzca el inventario en silencio.
function loadMensSnapshot() {
  if (!existsSync(MEN_SNAPSHOT_PATH)) return [];
  let snapshot;
  try { snapshot = JSON.parse(readFileSync(MEN_SNAPSHOT_PATH, "utf8")); } catch { return []; }
  const items = [
    ...(snapshot.clothing || []).map((url) => ({ url, type: "clothing" })),
    ...(snapshot.shoes || []).map((url) => ({ url, type: "shoes" }))
  ];
  const byPart = new Map();
  for (const entry of items) {
    const parsed = parseProductUrl(entry.url);
    if (!parsed) continue;
    const brand = brandFromSlug(parsed.brandSlug);
    const name = titleCase(parsed.nameSlug);
    const imageUrl = outnetImage(parsed.partNumber, "F");
    byPart.set(parsed.partNumber, {
      ...parsed,
      brand,
      name,
      type: entry.type,
      gender: "men",
      imageUrl,
      images: [imageUrl],
      basePriceUsd: estimatePrice(parsed.cat, parsed.nameSlug, entry.type, brand, parsed.partNumber)
    });
  }
  const clothing = balanceMens(
    [...byPart.values()].filter((item) => item.type === "clothing"),
    OUTNET_MEN_CLOTHING_LIMIT,
    "clothing"
  );
  const shoes = balanceMens(
    [...byPart.values()].filter((item) => item.type === "shoes"),
    OUTNET_MEN_SHOES_LIMIT,
    "shoes"
  );
  return [...clothing, ...shoes].map((item) => ({
    source: "theoutnet",
    sourceId: `ton-${item.partNumber}`,
    name: item.name,
    brand: item.brand,
    type: item.type,
    gender: "men",
    description: `${item.brand} — ${item.name}. Selección masculina de diseñador de The Outnet.`,
    imageUrl: item.imageUrl,
    images: item.images,
    sourceUrl: item.url,
    basePriceUsd: item.basePriceUsd
  }));
}

function mensBucket(product) {
  const text = `${product.cat} ${product.nameSlug}`.toLowerCase();
  if (product.type === "shoes") {
    if (/sneaker|trainer/.test(text)) return "sneakers";
    if (/boot/.test(text)) return "boots";
    if (/sandal|espadrille|slide|slipper/.test(text)) return "sandals";
    return "formal";
  }
  if (/polo/.test(text)) return "polos";
  if (/t-shirt|tee|tops/.test(text)) return "tees";
  if (/shirt|overshirt/.test(text)) return "shirts";
  if (/knit|sweater|cardigan|jumper/.test(text)) return "knitwear";
  if (/jacket|coat|blazer|parka|trench/.test(text)) return "outerwear";
  if (/pant|trouser|jean|denim/.test(text)) return "pants";
  if (/short|swim/.test(text)) return "shorts";
  if (/hoodie|sweat|track/.test(text)) return "sweats";
  if (/suit|tuxedo/.test(text)) return "suits";
  return "other";
}

function balanceMens(items, limit, type) {
  const order = type === "shoes"
    ? ["formal", "sneakers", "boots", "sandals"]
    : ["shirts", "polos", "tees", "knitwear", "outerwear", "pants", "shorts", "sweats", "suits", "other"];
  const pools = new Map(order.map((key) => [key, []]));
  for (const item of items) pools.get(mensBucket(item))?.push(item);
  const selected = [];
  while (selected.length < limit && [...pools.values()].some((pool) => pool.length)) {
    for (const key of order) {
      if (selected.length >= limit) break;
      const item = pools.get(key)?.shift();
      if (item) selected.push(item);
    }
  }
  return selected;
}

function parseMensPage(html, type) {
  const elements = extractJsonArray(html, "itemListElement");
  const out = [];
  for (const element of elements) {
    const item = element?.item;
    const parsed = item?.url ? parseProductUrl(item.url) : null;
    if (!item || !parsed) continue;
    const specifications = item.offers?.priceSpecification || [];
    const price = Number(specifications[0]?.price || item.offers?.price || 0);
    const images = (item.image || [])
      .map((image) => image?.url)
      .filter(Boolean)
      .map((url) => url.replace(/\/w\d+_q\d+\.jpg$/i, "/w1020_q80.jpg"));
    if (!price || !images.length) continue;
    const brand = displayBrand(item.brand?.name || titleCase(parsed.brandSlug));
    out.push({
      ...parsed,
      brand,
      type,
      gender: "men",
      name: item.name || titleCase(parsed.nameSlug),
      imageUrl: images[0],
      images: [...new Set(images)],
      basePriceUsd: price
    });
  }
  return out;
}

async function scrapeMensCategory(kind, pages, limit, type) {
  const byPart = new Map();
  // Con un snapshot versionado basta consultar la primera página para renovar
  // datos actuales; una actualización manual del snapshot amplía el universo.
  const pagesToFetch = existsSync(MEN_SNAPSHOT_PATH) ? Math.min(pages, 1) : pages;
  for (let page = 1; page <= pagesToFetch; page++) {
    const html = await fetchMensPage(kind, page);
    for (const item of parseMensPage(html, type)) byPart.set(item.partNumber, item);
  }
  const selected = balanceMens([...byPart.values()], limit, type);
  const buckets = selected.reduce((acc, item) => {
    const key = mensBucket(item);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  console.log(`  · /mens/${kind}: ${selected.length} productos`, buckets);
  return selected.map((item) => ({
    source: "theoutnet",
    sourceId: `ton-${item.partNumber}`,
    name: item.name,
    brand: item.brand,
    type: item.type,
    gender: "men",
    description: `${item.brand} — ${item.name}. Selección masculina de diseñador de The Outnet.`,
    imageUrl: item.imageUrl,
    images: item.images,
    sourceUrl: item.url,
    basePriceUsd: item.basePriceUsd
  }));
}

async function collectFromSitemaps(sitemaps, type) {
  const byBrand = new Map();
  for (const sm of sitemaps) {
    const urls = await fetchSitemap(sm);
    for (const url of urls) {
      if (!url.includes("/shop/product/")) continue;
      const p = parseProductUrl(url);
      if (!p) continue;
      const brandConfig = matchBrand(p.brandSlug);
      if (!brandConfig) continue;
      const brand = brandConfig.name;
      if (!byBrand.has(brand)) byBrand.set(brand, new Map());
      const items = byBrand.get(brand);
      if (items.size >= OUTNET_PER_BRAND * 4) continue; // margen para balancear tipo/género
      if (!items.has(p.partNumber)) {
        items.set(p.partNumber, {
          ...p,
          brand,
          type,
          gender: inferGender(`${p.cat} ${p.nameSlug}`, brandConfig.gender || "women")
        });
      }
    }
    await sleep(150);
  }
  return new Map([...byBrand].map(([brand, items]) => [brand, [...items.values()]]));
}

function balancedProducts(clothing, shoes, limit) {
  const pools = [[...clothing], [...shoes]];
  const selected = [];
  while (selected.length < limit && pools.some((p) => p.length)) {
    for (const pool of pools) {
      if (selected.length >= limit) break;
      const item = pool.shift();
      if (item) selected.push(item);
    }
  }
  return selected;
}

async function scrapeSitemapCatalog() {
  const out = [];
  const clothing = await collectFromSitemaps(OUTNET_SITEMAPS_CLOTHING, "clothing");
  const shoes = await collectFromSitemaps(OUTNET_SITEMAPS_SHOES, "shoes");

  const brands = new Set([...clothing.keys(), ...shoes.keys()]);
  for (const brand of brands) {
    const arr = balancedProducts(
      clothing.get(brand) || [],
      shoes.get(brand) || [],
      OUTNET_PER_BRAND
    );
    let taken = 0;
    for (const p of arr) {
      // Vista frontal oficial; si no existe, build-seed buscará respaldo web.
      let imageUrl = "";
      if (await imageOk(outnetImage(p.partNumber, "F"))) imageUrl = outnetImage(p.partNumber, "F");
      const base = estimatePrice(p.cat, p.nameSlug, p.type, brand, p.partNumber);
      out.push({
        source: "theoutnet",
        sourceId: `ton-${p.partNumber}`,
        name: titleCase(p.nameSlug),
        brand,
        type: p.type,
        gender: p.gender,
        description: `${brand} — ${titleCase(p.nameSlug)}. Selección de diseñador estilo lujo silencioso.`,
        imageUrl, // puede quedar vacío -> build-seed busca imagen real (Bing)
        images: imageUrl ? [imageUrl] : [],
        sourceUrl: p.url,
        basePriceUsd: base
      });
      taken++;
    }
    const men = out.filter((p) => p.brand === brand && p.gender === "men").length;
    const byType = out
      .filter((p) => p.brand === brand)
      .reduce((a, p) => ((a[p.type] = (a[p.type] || 0) + 1), a), {});
    console.log(`  · ${brand}: ${taken} productos (${men} hombre; ${byType.clothing || 0} ropa, ${byType.shoes || 0} zapatos)`);
  }
  return out;
}

export async function scrapeClothingAndShoes() {
  // Secuencial a propósito: Akamai bloquea ráfagas paralelas a /mens.
  const menClothing = await scrapeMensCategory(
    "clothing",
    OUTNET_MEN_CLOTHING_PAGES,
    OUTNET_MEN_CLOTHING_LIMIT,
    "clothing"
  );
  const menShoes = await scrapeMensCategory(
    "shoes",
    OUTNET_MEN_SHOES_PAGES,
    OUTNET_MEN_SHOES_LIMIT,
    "shoes"
  );
  const sitemapCatalog = process.env.SKIP_OUTNET_SITEMAPS === "1"
    ? []
    : await scrapeSitemapCatalog();

  // /mens manda para hombre; el sitemap mixto se conserva para mujer. Si
  // Akamai bloquea todas las páginas y no existe caché, se mantiene el pequeño
  // respaldo masculino inferido por marca en lugar de dejar el catálogo vacío.
  // La captura oficial versionada garantiza amplitud; el JSON-LD directo manda
  // cuando está disponible porque aporta el precio actual de liquidación.
  const snapshotMen = loadMensSnapshot();
  const verifiedMenMap = new Map();
  for (const product of [...snapshotMen, ...menClothing, ...menShoes]) {
    verifiedMenMap.set(product.sourceId, product);
  }
  const directMen = [...verifiedMenMap.values()];
  console.log(
    `  · respaldo masculino oficial: ${snapshotMen.length}; inventario verificado: ${directMen.length}`
  );
  const fallback = sitemapCatalog.filter(
    (product) => directMen.length === 0 || product.gender !== "men"
  );
  const merged = new Map();
  for (const product of [...fallback, ...directMen]) merged.set(product.sourceId, product);
  const products = [...merged.values()];
  console.log(
    `  · TheOutnet final: ${products.length} ` +
      `(${products.filter((p) => p.gender === "men" && p.type === "clothing").length} ropa hombre, ` +
      `${products.filter((p) => p.gender === "men" && p.type === "shoes").length} zapatos hombre)`
  );
  return products;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  scrapeClothingAndShoes().then((r) => {
    console.log(`${r.length} productos reales de TheOutnet`);
    console.log(JSON.stringify(r.slice(0, 3), null, 2));
  });
}
