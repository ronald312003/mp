// ============================================================
//  Orquestador de datos:
//   1) Scrapea Jomashop (relojes + perfumes)  -> datos reales
//   2) Carga TheOutnet (catálogo curado)      -> ropa + zapatos
//   3) Aplica reglas de precio (markup)
//   4) Asigna colecciones (outfits/estilos)
//   5) Obtiene tipo de cambio Kambista (+markup)
//   6) Escribe data/catalog.json y db/seed.sql
// ============================================================

import { writeFileSync, mkdirSync, readFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

import { scrapeWatches, scrapePerfumes } from "./scrape-jomashop.mjs";
import { scrapeClothingAndShoes } from "./scrape-theoutnet.mjs";
import { COLLECTIONS, assignCollections } from "./config.mjs";
import { finalPriceUsd } from "../lib/pricing.mjs";
import { getExchangeRate } from "../lib/exchange.mjs";
import { searchProductImage } from "../lib/image-search.mjs";
import { classifyAll, aiEnabled } from "../lib/ai-classify.mjs";

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
    name: base.name,
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
    inspirationImage: null
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

const sqlStr = (v) =>
  v === null || v === undefined ? "NULL" : `'${String(v).replace(/'/g, "''")}'`;
const sqlNum = (v) => (v === null || v === undefined ? "NULL" : Number(v));

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

function buildSeedSql(catalog) {
  const lines = [];
  lines.push("-- ============================================================");
  lines.push("-- Maison Privée — datos semilla (generado por scripts/build-seed.mjs)");
  lines.push(`-- Generado: ${catalog.generatedAt}`);
  lines.push(`-- Productos: ${catalog.products.length}`);
  lines.push("-- Ejecutar DESPUÉS de db/schema.sql");
  lines.push("-- ============================================================");
  lines.push("");
  lines.push("BEGIN;");
  lines.push("TRUNCATE product_collections, products, collections, settings RESTART IDENTITY CASCADE;");
  lines.push("");

  // settings
  lines.push("-- Ajustes / tipo de cambio");
  const settings = {
    generated_at: catalog.generatedAt,
    exchange_rate: String(catalog.exchange.rate),
    exchange_sell: String(catalog.exchange.sell),
    exchange_markup: String(catalog.exchange.markup),
    exchange_source: catalog.exchange.source,
    exchange_fetched_at: catalog.exchange.fetchedAt
  };
  for (const [k, v] of Object.entries(settings)) {
    lines.push(
      `INSERT INTO settings(key, value) VALUES (${sqlStr(k)}, ${sqlStr(v)}) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;`
    );
  }
  lines.push("");

  // collections
  lines.push("-- Colecciones (outfits / estilos / temporadas)");
  catalog.collections.forEach((c, i) => {
    lines.push(
      `INSERT INTO collections(slug, title, subtitle, description, kind, hero_image, sort_order) VALUES (` +
        `${sqlStr(c.slug)}, ${sqlStr(c.title)}, ${sqlStr(c.subtitle)}, ${sqlStr(c.description)}, ` +
        `${sqlStr(c.kind)}, ${sqlStr(c.heroImage)}, ${i + 1});`
    );
  });
  lines.push("");

  // products
  lines.push("-- Productos");
  for (const p of catalog.products) {
    lines.push(
      `INSERT INTO products(id, source, source_id, name, brand, type, gender, description, image_url, source_url, base_price_usd, final_price_usd, styling_note, inspiration_image) VALUES (` +
        `${sqlStr(p.id)}, ${sqlStr(p.source)}, ${sqlStr(p.sourceId)}, ${sqlStr(p.name)}, ${sqlStr(p.brand)}, ` +
        `${sqlStr(p.type)}, ${sqlStr(p.gender)}, ${sqlStr(p.description)}, ${sqlStr(p.imageUrl)}, ${sqlStr(p.sourceUrl)}, ` +
        `${sqlNum(p.basePriceUsd)}, ${sqlNum(p.finalPriceUsd)}, ${sqlStr(p.stylingNote)}, ${sqlStr(p.inspirationImage)});`
    );
  }
  lines.push("");

  // product_collections
  lines.push("-- Relación producto <-> colección");
  for (const p of catalog.products) {
    for (const slug of p.collections) {
      lines.push(
        `INSERT INTO product_collections(product_id, collection_slug) VALUES (${sqlStr(p.id)}, ${sqlStr(slug)}) ON CONFLICT DO NOTHING;`
      );
    }
  }
  lines.push("");
  lines.push("COMMIT;");
  lines.push("");
  return lines.join("\n");
}

async function main() {
  console.log("→ Tipo de cambio (Kambista)…");
  const exchange = await getExchangeRate();
  console.log(`  venta=${exchange.sell}  +${exchange.markup}  =>  S/ ${exchange.rate}  (${exchange.source})`);

  console.log("→ Relojes (Jomashop)…");
  const watches = await scrapeWatches();
  console.log("→ Perfumes (Jomashop)…");
  const perfumes = await scrapePerfumes();
  console.log("→ Ropa y zapatos (TheOutnet — catálogo curado)…");
  const fashion = await scrapeClothingAndShoes();

  const rawAll = [...watches, ...perfumes, ...fashion];

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
