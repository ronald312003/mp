// ============================================================
//  Orquestador de datos:
//   1) Scrapea Jomashop (relojes + perfumes)  -> datos reales
//   2) Carga TheOutnet (catálogo curado)      -> ropa + zapatos
//   3) Aplica reglas de precio (markup)
//   4) Asigna colecciones (outfits/estilos)
//   5) Obtiene tipo de cambio Kambista (+markup)
//   6) Escribe data/catalog.json y db/seed.sql
// ============================================================

import "./load-env.mjs";
import { writeFileSync, mkdirSync, readFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

import { scrapeWatches, scrapePerfumes } from "./scrape-jomashop.mjs";
import { scrapeClothingAndShoes } from "./scrape-theoutnet.mjs";
import { COLLECTIONS, MIN_PERFUME_BASE_USD, assignCollections } from "./config.mjs";
import { finalPriceUsd } from "../lib/pricing.mjs";
import { getExchangeRate } from "../lib/exchange.mjs";
import { searchProductImage } from "../lib/image-search.mjs";
import { classifyAll, aiEnabled } from "../lib/ai-classify.mjs";
import { buildSeedSql } from "./seed-sql.mjs";
import { enrichImages } from "./enrich-images.mjs";
import { generateRecos } from "./gen-recos.mjs";
import { generateAiImages } from "./gen-images-ai.mjs";
import { geminiEnabled } from "../lib/gemini.mjs";
import { cleanProductName } from "../lib/product-name.mjs";
import { enrichOfficialWatchMedia } from "./enrich-watch-media.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

// ID neutral que NO revela la tienda de origen (ni en la URL ni al inspeccionar).
function slugId(source, sourceId) {
  const h = createHash("sha1").update(`${source}:${sourceId}`).digest("hex").slice(0, 12);
  return `mp-${h}`;
}

function enrich(base) {
  const finalUsd = finalPriceUsd(base.basePriceUsd);
  const collections = assignCollections(base);
  return {
    id: slugId(base.source, base.sourceId),
    source: base.source,
    sourceId: String(base.sourceId),
    name: cleanProductName(base.name, base.type),
    brand: base.brand,
    type: base.type,
    gender: base.gender,
    description: base.description,
    imageUrl: base.imageUrl,
    sourceUrl: base.sourceUrl,
    basePriceUsd: Math.round(base.basePriceUsd * 100) / 100,
    finalPriceUsd: finalUsd,
    collections,
    stylingNote: null,
    inspirationImage: null,
    images: base.images && base.images.length ? base.images : base.imageUrl ? [base.imageUrl] : [],
    recoIds: null,
    recoNote: null,
    recoContext: null
  };
}

// Imagen de referencia de estilo ("cómo quedaría") por colección + género.
const COLLECTION_VIBE = {
  "lujo-silencioso": "quiet luxury minimalist",
  elegante: "elegant tailored refined",
  casual: "smart casual",
  oficina: "business formal tailoring",
  noche: "evening gala black tie",
  verano: "summer linen light",
  invierno: "winter coat layered",
  deportivo: "sporty athleisure"
};
async function resolveInspiration(products, cachePath) {
  let cache = {};
  if (existsSync(cachePath)) {
    try { cache = JSON.parse(readFileSync(cachePath, "utf8")); } catch {}
  }
  const genderWord = (g) => (g === "men" ? "menswear men" : g === "women" ? "womenswear women" : "fashion");
  const keyOf = (p) => `${p.collections[0] || "elegante"}|${p.gender}`;
  const keys = [...new Set(products.map(keyOf))];
  let found = 0;
  for (const key of keys) {
    if (cache[key] === undefined) {
      const [coll, gender] = key.split("|");
      const q = `${COLLECTION_VIBE[coll] || "elegant"} ${genderWord(gender)} outfit lookbook`;
      cache[key] = (await searchProductImage(q)) || null;
      writeFileSync(cachePath, JSON.stringify(cache, null, 0), "utf8");
    }
  }
  for (const p of products) {
    const url = cache[keyOf(p)];
    if (url) { p.inspirationImage = url; found++; }
  }
  console.log(`  · inspiración asignada: ${found}/${products.length} (${keys.length} combos)`);
}

// ¿La imagen actual es genérica (no es del producto real)?
const isGenericImage = (p) =>
  !p.imageUrl || /unsplash\.com|placeholder|picsum/i.test(p.imageUrl);

// Resuelve imágenes reales para los productos con foto genérica,
// buscándolas en internet. Cachea por consulta para acelerar re-runs.
async function resolveRealImages(products, cachePath) {
  let cache = {};
  if (existsSync(cachePath)) {
    try {
      cache = JSON.parse(readFileSync(cachePath, "utf8"));
    } catch {}
  }
  let found = 0;
  const targets = products.filter(isGenericImage);
  console.log(`  · buscando imagen real para ${targets.length} productos…`);

  for (const p of targets) {
    const query = `${p.brand} ${p.name}`.slice(0, 120);
    let url = cache[query];
    if (url === undefined) {
      url = await searchProductImage(query);
      cache[query] = url || null;
      writeFileSync(cachePath, JSON.stringify(cache, null, 0), "utf8");
    }
    if (url) {
      p.imageUrl = url;
      found++;
    }
  }
  console.log(`  · imágenes reales encontradas: ${found}/${targets.length}`);
}

function loadPreviousJomashop() {
  const catalogPath = resolve(ROOT, "data/catalog.json");
  if (!existsSync(catalogPath)) return { watches: [], perfumes: [] };
  let catalog;
  try { catalog = JSON.parse(readFileSync(catalogPath, "utf8")); } catch { return { watches: [], perfumes: [] }; }
  const products = (catalog.products || [])
    .filter((product) => product.source === "jomashop")
    .filter((product) => product.brand?.toLowerCase() !== "casio")
    .map((product) => ({
      source: product.source,
      sourceId: product.sourceId,
      name: product.name,
      brand: product.brand,
      type: product.type,
      gender: product.gender,
      description: product.description,
      imageUrl: product.imageUrl,
      images: product.images,
      sourceUrl: product.sourceUrl,
      basePriceUsd: product.basePriceUsd
    }));
  return {
    watches: products.filter((product) => product.type === "watch"),
    perfumes: products.filter(
      (product) => product.type === "perfume" && product.basePriceUsd >= MIN_PERFUME_BASE_USD
    )
  };
}

function loadPreviousOutnetWomen() {
  const catalogPath = resolve(ROOT, "data/catalog.json");
  if (!existsSync(catalogPath)) return [];
  let catalog;
  try { catalog = JSON.parse(readFileSync(catalogPath, "utf8")); } catch { return []; }
  return (catalog.products || [])
    .filter((product) => product.source === "theoutnet" && product.gender !== "men")
    .map((product) => ({
      source: product.source,
      sourceId: product.sourceId,
      name: product.name,
      brand: product.brand,
      type: product.type,
      gender: product.gender,
      description: product.description,
      imageUrl: product.imageUrl,
      images: product.images,
      sourceUrl: product.sourceUrl,
      basePriceUsd: product.basePriceUsd
    }));
}


async function main() {
  console.log("→ Tipo de cambio (Kambista)…");
  const exchange = await getExchangeRate();
  console.log(`  venta=${exchange.sell}  +${exchange.markup}  =>  S/ ${exchange.rate}  (${exchange.source})`);

  const reuseJomashop = process.env.REUSE_JOMASHOP_CATALOG === "1";
  let watches, perfumes;
  if (reuseJomashop) {
    ({ watches, perfumes } = loadPreviousJomashop());
    console.log(`→ Jomashop: reutilizando catálogo verificado (${watches.length} relojes, ${perfumes.length} perfumes)…`);
  } else {
    console.log("→ Relojes (Jomashop)…");
    watches = await scrapeWatches();
    console.log("→ Perfumes (Jomashop)…");
    perfumes = await scrapePerfumes();
  }
  console.log("→ Ropa y zapatos (TheOutnet — catálogo curado)…");
  const scrapedFashion = await scrapeClothingAndShoes();
  const scrapedWomen = scrapedFashion.filter((product) => product.gender !== "men");
  const reusePreviousWomen =
    process.env.REUSE_OUTNET_WOMEN === "1" || scrapedWomen.length < 100;
  const previousWomen = reusePreviousWomen
    ? loadPreviousOutnetWomen()
    : [];
  const fashionMap = new Map();
  for (const product of [...previousWomen, ...scrapedFashion]) {
    fashionMap.set(product.sourceId, product);
  }
  const fashion = [...fashionMap.values()];
  if (previousWomen.length) {
    console.log(`  · TheOutnet: ${previousWomen.length} productos femeninos verificados reutilizados`);
  }

  // Casio se gestionará exclusivamente de forma manual desde /admin.
  const rawAll = [...watches, ...perfumes, ...fashion].filter(
    (product) => product.brand?.toLowerCase() !== "casio"
  );

  // dedupe por id (aún NO descartamos por imagen: primero se busca en la web)
  const map = new Map();
  for (const base of rawAll) {
    const p = enrich(base);
    if (!p.basePriceUsd) continue;
    map.set(p.id, p);
  }
  let products = [...map.values()];

  // Buscar imágenes reales para los productos sin foto / con foto genérica
  console.log("→ Imágenes reales (búsqueda web para ropa/zapatos sin imagen)…");
  const cacheDir = resolve(ROOT, "scripts/.cache");
  mkdirSync(cacheDir, { recursive: true });
  await resolveRealImages(products, resolve(cacheDir, "images.json"));

  // Ahora sí, descartar los que sigan sin imagen y ordenar por precio
  const before = products.length;
  products = products.filter((p) => p.imageUrl).sort((a, b) => a.finalPriceUsd - b.finalPriceUsd);
  if (before !== products.length) console.log(`  · descartados sin imagen: ${before - products.length}`);

  // Clasificación INTELIGENTE con IA (colecciones por ocasión/estilo/temporada).
  // Respaldo: la clasificación por reglas ya asignada en enrich().
  if (aiEnabled()) {
    console.log("→ Clasificación inteligente (IA gpt-5.4-mini)…");
    const cachePath = resolve(cacheDir, "classify.json");
    let cache = {};
    if (existsSync(cachePath)) {
      try { cache = JSON.parse(readFileSync(cachePath, "utf8")); } catch {}
    }
    const pending = products.filter((p) => !cache[p.id]);
    if (pending.length) {
      const cls = await classifyAll(
        pending.map((p) => ({ brand: p.brand, name: p.name, type: p.type })),
        (done, total) => process.stdout.write(`\r  · ${done}/${total}   `)
      );
      pending.forEach((p, i) => { if (cls[i]) cache[p.id] = cls[i]; });
      writeFileSync(cachePath, JSON.stringify(cache, null, 0), "utf8");
      process.stdout.write("\n");
    }
    let applied = 0, described = 0, styled = 0;
    for (const p of products) {
      const ai = cache[p.id];
      if (ai && ai.collections && ai.collections.length) { p.collections = ai.collections; applied++; }
      if (ai && ai.description) { p.description = ai.description; described++; }
      if (ai && ai.styling) { p.stylingNote = ai.styling; styled++; }
    }
    console.log(`  · IA: ${applied} clasificados, ${described} descripciones, ${styled} notas de estilo`);
  } else {
    console.log("→ (sin OPENAI_API_KEY: clasificación por reglas)");
  }

  // Imágenes de inspiración de estilo (una por colección+género, reutilizadas)
  console.log("→ Imágenes de inspiración de estilo…");
  await resolveInspiration(products, resolve(cacheDir, "inspiration.json"));

  // Galería multi-imagen (Jomashop media_gallery / vistas TheOutnet / "en modelo")
  console.log("→ Galerías de imágenes (varias vistas por producto)…");
  await enrichImages(products, cacheDir);

  // Medios del fabricante, solo cuando la referencia/modelo coincide exactamente.
  console.log("→ Medios oficiales de relojería (validación por modelo)…");
  await enrichOfficialWatchMedia(products, cacheDir);

  // Siempre genera recomendaciones válidas. Gemini mejora la redacción cuando
  // está configurado; sin API se conserva el filtrado profesional por género,
  // categoría, ocasión y nivel de precio.
  if (geminiEnabled()) {
    console.log("→ Recomendaciones de estilo (Gemini + reglas estrictas)…");
  } else {
    console.log("→ Recomendaciones de estilo (reglas estrictas)…");
  }
  await generateRecos(products, cacheDir);

  // Las imágenes generativas sí requieren Gemini y un límite explícito.
  if (geminiEnabled()) {
    const imgLimit = Number(process.env.GEMINI_IMG_LIMIT || 0);
    if (imgLimit > 0) {
      console.log(`→ Imágenes editoriales AI (límite ${imgLimit})…`);
      await generateAiImages(products, cacheDir, imgLimit);
    }
  }

  const catalog = {
    generatedAt: new Date().toISOString(),
    exchange,
    collections: COLLECTIONS.map((c) => ({
      slug: c.slug,
      title: c.title,
      subtitle: c.subtitle,
      description: c.description,
      kind: c.kind,
      heroImage: c.heroImage
    })),
    products
  };

  // resumen
  const byType = products.reduce((a, p) => ((a[p.type] = (a[p.type] || 0) + 1), a), {});
  console.log("\nResumen:", byType, "| total", products.length);

  // escribir archivos
  const jsonPath = resolve(ROOT, "data/catalog.json");
  mkdirSync(dirname(jsonPath), { recursive: true });
  writeFileSync(jsonPath, JSON.stringify(catalog, null, 2), "utf8");
  console.log("✓ data/catalog.json");

  const sqlPath = resolve(ROOT, "db/seed.sql");
  mkdirSync(dirname(sqlPath), { recursive: true });
  writeFileSync(sqlPath, buildSeedSql(catalog), "utf8");
  console.log("✓ db/seed.sql");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
