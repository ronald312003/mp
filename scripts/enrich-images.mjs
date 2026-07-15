// ============================================================
//  Galería de imágenes por producto (varias fotos REALES).
//
//  Fuentes, en orden de fiabilidad:
//   1) Jomashop  -> media_gallery vía GraphQL (todas las fotos del producto)
//   2) TheOutnet -> vistas del CDN net-a-porter (in/ou/fr/bk/cu) por partNumber
//   3) Ropa/zapatos -> 1 foto extra "en modelo" (búsqueda web) si faltan vistas
//
//  Ejecutar directo:
//    node scripts/enrich-images.mjs
//  (relee data/catalog.json, quita perfumes con costo < 120 USD,
//   enriquece las galerías y reescribe catalog.json + db/seed.sql)
// ============================================================

import "./load-env.mjs";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { buildSeedSql } from "./seed-sql.mjs";
import { MIN_PERFUME_BASE_USD } from "./config.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const MAX_IMAGES = 6;

const loadJson = (p, fb = {}) => {
  try { return existsSync(p) ? JSON.parse(readFileSync(p, "utf8")) : fb; } catch { return fb; }
};
const saveJson = (p, data) => writeFileSync(p, JSON.stringify(data, null, 0), "utf8");

// Pool simple de concurrencia.
async function pool(items, size, fn) {
  const queue = [...items];
  const workers = Array.from({ length: size }, async () => {
    while (queue.length) await fn(queue.shift());
  });
  await Promise.all(workers);
}

// ---------- Jomashop: media_gallery por lotes de SKU ----------
async function jomashopGalleries(skus) {
  const out = new Map();
  const batches = [];
  for (let i = 0; i < skus.length; i += 20) batches.push(skus.slice(i, i + 20));
  for (const batch of batches) {
    const list = batch.map((s) => `"${String(s).replace(/"/g, '\\"')}"`).join(",");
    const q = `{ products(filter:{sku:{in:[${list}]}}, pageSize:${batch.length}) { items { sku media_gallery{url} } } }`;
    try {
      const res = await fetch(
        "https://www.jomashop.com/graphql?query=" + encodeURIComponent(q),
        { headers: { "user-agent": UA, accept: "application/json", store: "default" }, signal: AbortSignal.timeout(30000) }
      );
      const json = await res.json();
      for (const it of json?.data?.products?.items || []) {
        const urls = (it.media_gallery || []).map((g) => g?.url).filter(Boolean);
        if (urls.length) out.set(it.sku, urls);
      }
    } catch (e) {
      console.warn(`  ! jomashop lote: ${e.message}`);
    }
    await sleep(300);
  }
  return out;
}

// ---------- TheOutnet: vistas actuales del CDN por partNumber ----------
const OUTNET_VIEWS = ["F", "R", "Q", "D", "E", "N"];
const outnetUrl = (pn, view) =>
  `https://www.theoutnet.com/variants/images/${pn}/${view}/w1020_q80.jpg`;

async function imageOk(url) {
  try {
    const r = await fetch(url, {
      method: "GET",
      headers: { "user-agent": UA, range: "bytes=0-1024" },
      signal: AbortSignal.timeout(9000)
    });
    return r.ok && (r.headers.get("content-type") || "").startsWith("image/");
  } catch {
    return false;
  }
}

/**
 * Enriquce products[].images (muta el array). Cachea en cacheDir para
 * que re-ejecutar sea rápido.
 */
export async function enrichImages(products, cacheDir) {
  mkdirSync(cacheDir, { recursive: true });

  // 1) Jomashop: galería oficial completa
  const joma = products.filter((p) => p.source === "jomashop");
  const gCachePath = resolve(cacheDir, "galleries.json");
  const gCache = loadJson(gCachePath);
  const missing = joma.filter((p) => !gCache[p.sourceId]).map((p) => p.sourceId);
  if (missing.length) {
    console.log(`  · Jomashop: pidiendo galería de ${missing.length} productos…`);
    const got = await jomashopGalleries(missing);
    for (const [sku, urls] of got) gCache[sku] = urls;
    for (const sku of missing) if (!gCache[sku]) gCache[sku] = null; // no reintentar
    saveJson(gCachePath, gCache);
  }
  let jomaMulti = 0;
  for (const p of joma) {
    const urls = gCache[p.sourceId] || [];
    // Si una corrida antigua había sustituido la portada con una búsqueda
    // abierta, vuelve a una vista del SKU servida por el CDN oficial.
    if (!/\/\/cdn2\.jomashop\.com\//i.test(p.imageUrl || "") && urls[0]) {
      p.imageUrl = urls[0];
    }
    const generated = (p.images || []).filter((url) =>
      url.startsWith(`/generated/${p.id}-ai-`)
    );
    p.images = [...new Set([p.imageUrl, ...urls, ...generated].filter(Boolean))].slice(0, MAX_IMAGES);
    if (p.images.length > 1) jomaMulti++;
  }
  console.log(`  · Jomashop: ${jomaMulti}/${joma.length} con galería (2+ fotos)`);

  // 2) TheOutnet: vistas alternativas del CDN
  const ton = products.filter((p) => p.source === "theoutnet");
  const vCachePath = resolve(cacheDir, "outnet-views-v2.json");
  const vCache = loadJson(vCachePath);
  let probed = 0;
  await pool(ton, 6, async (p) => {
    const pn = String(p.sourceId).replace(/^ton-/, "");
    if (vCache[pn] === undefined) {
      const ok = [];
      const checked = await Promise.all(
        OUTNET_VIEWS.map(async (view) => {
          const url = outnetUrl(pn, view);
          return (await imageOk(url)) ? url : null;
        })
      );
      ok.push(...checked.filter(Boolean));
      vCache[pn] = ok;
      probed++;
      if (probed % 25 === 0) saveJson(vCachePath, vCache);
    }
    const official = vCache[pn] || [];
    const generated = (p.images || []).filter((url) =>
      url.startsWith(`/generated/${p.id}-ai-`)
    );
    const front = official.find((url) => url.includes(`/${pn}/F/`));
    if (front) p.imageUrl = front;
    p.images = [...new Set([front, ...official, p.imageUrl, ...generated].filter(Boolean))]
      .slice(0, MAX_IMAGES);
  });
  saveJson(vCachePath, vCache);
  const tonMulti = ton.filter((p) => (p.images?.length || 0) > 1).length;
  console.log(`  · TheOutnet: ${tonMulti}/${ton.length} con galería (2+ fotos)`);

  // 3) Nunca mezclar resultados de búsqueda abierta: una coincidencia textual
  // puede ser otra variante o incluso otro producto. Las galerías cortas se
  // completan después con medios oficiales validados o Gemini desde la foto base.
  const sparse = products.filter((p) => (p.images?.length || 0) < 3);
  console.log(`  · Galerías pendientes de vista adicional verificada: ${sparse.length}`);

  // Garantía: todo producto tiene al menos [imageUrl]
  for (const p of products) {
    if (!p.images || !p.images.length) p.images = p.imageUrl ? [p.imageUrl] : [];
    p.images = [...new Set([p.imageUrl, ...p.images].filter(Boolean))].slice(0, MAX_IMAGES);
  }
}

// ---------- ejecutable directo ----------
if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  (async () => {
    const catPath = resolve(ROOT, "data/catalog.json");
    const catalog = JSON.parse(readFileSync(catPath, "utf8"));

    // Filtro pedido: perfumes con costo < 120 USD fuera del catálogo.
    const before = catalog.products.length;
    catalog.products = catalog.products.filter(
      (p) => !(p.type === "perfume" && p.basePriceUsd < MIN_PERFUME_BASE_USD)
    );
    console.log(`→ Perfumes con costo < $${MIN_PERFUME_BASE_USD} eliminados: ${before - catalog.products.length}`);

    console.log("→ Enriqueciendo galerías de imágenes…");
    await enrichImages(catalog.products, resolve(ROOT, "scripts/.cache"));

    writeFileSync(catPath, JSON.stringify(catalog, null, 2), "utf8");
    console.log("✓ data/catalog.json");
    writeFileSync(resolve(ROOT, "db/seed.sql"), buildSeedSql(catalog), "utf8");
    console.log(`✓ db/seed.sql (${catalog.products.length} productos)`);
  })().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
