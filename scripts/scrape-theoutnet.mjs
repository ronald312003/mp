// ============================================================
//  TheOutnet (ropa + zapatos de diseñador) — PRODUCTOS REALES
//
//  El sitio bloquea las fichas/API con Akamai + IBM WCS (storeId
//  numérico privado), por lo que NO se puede leer el precio en vivo.
//  PERO los SITEMAPS sí son públicos y listan TODOS los productos
//  reales (marca, categoría, nombre y partNumber). Y la imagen real
//  del producto se obtiene del CDN de imágenes por su partNumber:
//    https://cache.net-a-porter.com/variants/images/{pn}/in/w920.jpg
//
//  Por tanto: nombre + marca + categoría + imagen = REALES.
//  El precio se ESTIMA en rango outlet (no es posible el real).
//  Marcas permitidas: las 10 indicadas por el usuario.
// ============================================================

import {
  OUTNET_SITEMAPS_CLOTHING,
  OUTNET_SITEMAPS_SHOES,
  OUTNET_BRANDS,
  OUTNET_PER_BRAND
} from "./config.mjs";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";
const H = { "user-agent": UA };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchSitemap(name) {
  try {
    const r = await fetch("https://www.theoutnet.com/" + name, {
      headers: H,
      signal: AbortSignal.timeout(30000)
    });
    if (!r.ok) return [];
    const t = await r.text();
    return [...t.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  } catch {
    return [];
  }
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
    if (b.match.some((s) => brandSlug === s || brandSlug.startsWith(s))) return b.name;
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

function inferGender(text) {
  const t = text.toLowerCase();
  if (/\b(men|mens|man|male|tuxedo)\b/.test(t)) return "men";
  if (/\b(dress|gown|skirt|blouse|bodysuit|bra|lingerie|jumpsuit|playsuit|ballet|pump|heel|espadrille)\b/.test(t))
    return "women";
  return "women"; // TheOutnet es mayoritariamente womenswear
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
const napImage = (pn, view = "in") =>
  `https://cache.net-a-porter.com/variants/images/${pn}/${view}/w920.jpg`;

async function collectFromSitemaps(sitemaps, type) {
  const byBrand = new Map();
  for (const sm of sitemaps) {
    const urls = await fetchSitemap(sm);
    for (const url of urls) {
      if (!url.includes("/shop/product/")) continue;
      const p = parseProductUrl(url);
      if (!p) continue;
      const brand = matchBrand(p.brandSlug);
      if (!brand) continue;
      if (!byBrand.has(brand)) byBrand.set(brand, []);
      const arr = byBrand.get(brand);
      if (arr.length >= OUTNET_PER_BRAND * 2) continue; // margen para descartes de imagen
      arr.push({ ...p, brand, type });
    }
    await sleep(150);
  }
  return byBrand;
}

export async function scrapeClothingAndShoes() {
  const out = [];
  const clothing = await collectFromSitemaps(OUTNET_SITEMAPS_CLOTHING, "clothing");
  const shoes = await collectFromSitemaps(OUTNET_SITEMAPS_SHOES, "shoes");

  const merged = new Map();
  for (const [b, arr] of clothing) merged.set(b, [...arr]);
  for (const [b, arr] of shoes) merged.set(b, [...(merged.get(b) || []), ...arr]);

  for (const [brand, arr] of merged) {
    let taken = 0;
    for (const p of arr) {
      if (taken >= OUTNET_PER_BRAND) break;
      // imagen real por partNumber; si no existe, la buscará build-seed (Bing)
      let imageUrl = "";
      if (await imageOk(napImage(p.partNumber, "in"))) imageUrl = napImage(p.partNumber, "in");
      else if (await imageOk(napImage(p.partNumber, "ou"))) imageUrl = napImage(p.partNumber, "ou");
      const base = estimatePrice(p.cat, p.nameSlug, p.type, brand, p.partNumber);
      out.push({
        source: "theoutnet",
        sourceId: `ton-${p.partNumber}`,
        name: titleCase(p.nameSlug),
        brand,
        type: p.type,
        gender: inferGender(p.cat + " " + p.nameSlug),
        description: `${brand} — ${titleCase(p.nameSlug)}. Selección de diseñador estilo lujo silencioso.`,
        imageUrl, // puede quedar vacío -> build-seed busca imagen real (Bing)
        sourceUrl: p.url,
        basePriceUsd: base
      });
      taken++;
    }
    console.log(`  · ${brand}: ${taken} prendas/zapatos`);
  }
  return out;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  scrapeClothingAndShoes().then((r) => {
    console.log(`${r.length} productos reales de TheOutnet`);
    console.log(JSON.stringify(r.slice(0, 3), null, 2));
  });
}
