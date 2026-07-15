// ============================================================
//  Scraper Jomashop (relojes + perfumes) vía GraphQL público
//  Datos reales: nombre, marca, precio, imagen, url.
// ============================================================

import {
  WATCH_CATEGORIES,
  WATCH_SCAN_PAGES,
  HERO_WATCHES,
  FRAGRANCE_CATEGORY_ID,
  PERFUME_PER_BRAND,
  PERFUME_BRANDS,
  MIN_PERFUME_OZ,
  MIN_PERFUME_BASE_USD,
  HERO_FRAGRANCES
} from "./config.mjs";
import { cleanProductName } from "../lib/product-name.mjs";

const ENDPOINT = "https://www.jomashop.com/graphql";
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function gql(query, tries = 4) {
  const url = ENDPOINT + "?query=" + encodeURIComponent(query);
  let lastErr;
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, {
        headers: { "user-agent": UA, accept: "application/json", store: "default" },
        signal: AbortSignal.timeout(30000)
      });
      const json = await res.json();
      if (json.errors) throw new Error(json.errors[0]?.message || "graphql error");
      return json.data;
    } catch (e) {
      lastErr = e;
      await sleep(800 * (i + 1));
    }
  }
  throw lastErr;
}

function pickImage(item) {
  return (
    item?.image?.url ||
    item?.small_image?.url ||
    item?.thumbnail?.url ||
    ""
  );
}

function productUrl(urlKey) {
  return urlKey ? `https://www.jomashop.com/${urlKey}.html` : null;
}

const ITEM_FIELDS = `
  total_count
  items {
    name sku url_key stock_status
    image{url} small_image{url}
    media_gallery{url}
    short_description{html}
    price_range{minimum_price{final_price{value currency}}}
  }`;

// Todas las fotos reales del producto (galería), sin duplicados.
function pickImages(item) {
  const main = pickImage(item);
  const urls = [main, ...(item?.media_gallery || []).map((g) => g?.url).filter(Boolean)];
  return [...new Set(urls.filter(Boolean))].slice(0, 6);
}

async function fetchCategoryPage(categoryId, page, pageSize = 100) {
  const q = `{
    products(filter:{category_id:{eq:"${categoryId}"}}, pageSize:${pageSize}, currentPage:${page}, sort:{position:ASC}) {${ITEM_FIELDS}}
  }`;
  const data = await gql(q);
  return data.products;
}

// Fragancias de una marca concreta usando el atributo manufacturer.
async function fetchBrandFragrances(manufacturer, page, pageSize = 60) {
  const q = `{
    products(filter:{category_id:{eq:"${FRAGRANCE_CATEGORY_ID}"}, manufacturer:{eq:"${manufacturer.replace(/"/g, '\\"')}"}}, pageSize:${pageSize}, currentPage:${page}, sort:{position:ASC}) {${ITEM_FIELDS}}
  }`;
  const data = await gql(q);
  return data.products;
}

function toProduct(item, { type, gender, brand }) {
  const price = Number(item?.price_range?.minimum_price?.final_price?.value || 0);
  return {
    source: "jomashop",
    sourceId: item.sku,
    name: cleanProductName(item.name, type),
    brand,
    type,
    gender,
    description: item?.short_description?.html?.replace(/<[^>]+>/g, "").trim() || null,
    imageUrl: pickImage(item),
    images: pickImages(item),
    sourceUrl: productUrl(item.url_key),
    basePriceUsd: price
  };
}

// Prioridad por nivel: el índice del primer icónico que coincide (menor = más
// prioritario). HERO_WATCHES está ordenado con los modelos SIGNATURE primero
// (Tsuyosa, Promaster, PRX, Prospex…) y las líneas amplias (Eco-Drive) después,
// así un Tsuyosa gana a un Eco-Drive genérico. Sin match => Infinity.
const heroScore = (name) => {
  const n = name.toLowerCase();
  const i = HERO_WATCHES.findIndex((h) => n.includes(h));
  return i === -1 ? Infinity : i;
};
const isHeroWatch = (name) => heroScore(name) !== Infinity;

// ---- RELOJES (escanea varias páginas, prioriza modelos icónicos) ----
export async function scrapeWatches() {
  const out = [];
  for (const cat of WATCH_CATEGORIES) {
    const candidates = [];
    const seen = new Set();
    for (let page = 1; page <= WATCH_SCAN_PAGES; page++) {
      let res;
      try {
        res = await fetchCategoryPage(cat.categoryId, page);
      } catch (e) {
        console.warn(`  ! ${cat.brand} p${page}: ${e.message}`);
        break;
      }
      for (const it of res.items) {
        const price = Number(it?.price_range?.minimum_price?.final_price?.value || 0);
        if (!price || price <= 0) continue;
        if (!pickImage(it)) continue;
        if (seen.has(it.sku)) continue;
        seen.add(it.sku);
        candidates.push(it);
      }
      if (res.items.length === 0) break;
      await sleep(350);
    }
    // Ordenar por prioridad de modelo (signature primero), estable por posición.
    const withIdx = candidates.map((it, idx) => ({ it, idx, score: heroScore(it.name) }));
    withIdx.sort((a, b) => a.score - b.score || a.idx - b.idx);
    const items = withIdx.slice(0, cat.perBrand).map((x) => x.it);
    for (const it of items) {
      out.push(toProduct(it, { type: "watch", gender: guessGender(it.name), brand: cat.brand }));
    }
    const heroCount = items.filter((i) => isHeroWatch(i.name)).length;
    console.log(`  · ${cat.brand}: ${items.length} relojes (${heroCount} icónicos)`);
  }
  return out;
}

// Tamaño en oz del título ("... 3.4 oz ...")
function parseOz(name) {
  const m = name.match(/([\d.]+)\s*oz/i);
  return m ? parseFloat(m[1]) : null;
}
// Descarta lo que no es un frasco completo de venta.
function isFullBottle(name) {
  if (/\b(tester|sample|vial|miniature|travel|gift set|set\b|coffret|deodorant|body|shower|lotion|refill|hair mist)\b/i.test(name))
    return false;
  const oz = parseOz(name);
  return oz !== null && oz > MIN_PERFUME_OZ;
}
const isHero = (name) => {
  const n = name.toLowerCase();
  return HERO_FRAGRANCES.some((h) => n.includes(h));
};

// ---- PERFUMES (por marca, filtro manufacturer, solo >2oz, iconos primero) ----
export async function scrapePerfumes() {
  const out = [];
  for (const brand of PERFUME_BRANDS) {
    const candidates = [];
    const seen = new Set();
    for (let page = 1; page <= 3; page++) {
      let res;
      try {
        res = await fetchBrandFragrances(brand, page);
      } catch (e) {
        console.warn(`  ! ${brand} p${page}: ${e.message}`);
        break;
      }
      for (const it of res.items) {
        const price = Number(it?.price_range?.minimum_price?.final_price?.value || 0);
        if (!price || price <= 0) continue;
        if (price < MIN_PERFUME_BASE_USD) continue; // costo mínimo 120 USD
        if (!pickImage(it)) continue;
        if (!isFullBottle(it.name)) continue; // SOLO > 2 oz, frasco completo
        if (seen.has(it.sku)) continue;
        seen.add(it.sku);
        candidates.push(it);
      }
      if (res.items.length === 0) break;
      await sleep(220);
    }
    // Icónicas primero (Erba Pura, Aventus, etc.), luego el resto en orden.
    candidates.sort((a, b) => (isHero(b.name) ? 1 : 0) - (isHero(a.name) ? 1 : 0));
    const items = candidates.slice(0, PERFUME_PER_BRAND);
    for (const it of items) {
      out.push(toProduct(it, { type: "perfume", gender: guessGender(it.name), brand }));
    }
    console.log(`  · ${brand}: ${items.length} perfumes${items.some((i) => isHero(i.name)) ? " ★" : ""}`);
    await sleep(180);
  }
  return out;
}

function guessGender(name) {
  const n = name.toLowerCase();
  if (/women|ladies|femme|her\b|woman|pour femme/.test(n)) return "women";
  if (/men|homme|him\b|man\b|pour homme/.test(n)) return "men";
  return "unisex";
}

// Ejecutable directo para pruebas: node scripts/scrape-jomashop.mjs
if (import.meta.url === `file://${process.argv[1]}`) {
  (async () => {
    console.log("Relojes…");
    const w = await scrapeWatches();
    console.log("Perfumes…");
    const p = await scrapePerfumes();
    console.log(`TOTAL: ${w.length} relojes, ${p.length} perfumes`);
    console.log(JSON.stringify([...w, ...p].slice(0, 3), null, 2));
  })();
}
