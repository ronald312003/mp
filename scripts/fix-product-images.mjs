import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { createHash } from "node:crypto";

/**
 * Revisa cada imagen de los productos contra su CDN y reescribe el catálogo:
 *   - ELIMINA solo con evidencia positiva: el placeholder "JS" de Jomashop
 *     (detectado por tamaño + sha1 del contenido) o un 404/410 definitivo.
 *   - CONSERVA las URLs que fallan por red/throttling (p. ej. tissotwatches.com
 *     corta conexiones): no se puede afirmar que estén rotas.
 *   - imageUrl pasa a ser la primera imagen CONFIRMADA real; las no verificadas
 *     quedan después, y el proxy /api/img las salta en runtime si fallan.
 * Uso: node scripts/fix-product-images.mjs            (perfume por defecto)
 *      FIX_IMAGE_TYPES=perfume,watch node scripts/fix-product-images.mjs
 */
const catalogPath = resolve("data/catalog.json");
const catalog = JSON.parse(readFileSync(catalogPath, "utf8"));
const types = new Set(
  String(process.env.FIX_IMAGE_TYPES || "perfume")
    .split(",").map((v) => v.trim()).filter(Boolean)
);
const concurrency = Math.max(1, Number(process.env.FIX_IMAGE_CONCURRENCY || 8));
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36";
const HEADERS = {
  "user-agent": UA,
  accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8"
};
// URL de una foto que Jomashop NO tiene: siempre responde su placeholder "JS".
const KNOWN_PLACEHOLDER_URL =
  "https://cdn2.jomashop.com/media/catalog/product/cache/bb8fda0b339dbe7c4b0b03f372ea5c01/j/e/jean-paul-gaultier-mens-le-male-le-parfum-edp-spray-42-oz-fragrances-8435415032315_2.jpg";

const isJomashop = (url) => {
  try { return /\.jomashop\.com$/i.test(new URL(url).hostname); } catch { return false; }
};

function identity(value) {
  try {
    const url = new URL(value);
    if (isJomashop(value)) {
      url.pathname = url.pathname.replace(/\/media\/catalog\/product\/cache\/[^/]+\//i, "/media/catalog/product/");
      url.search = "";
    }
    return url.toString();
  } catch {
    return String(value || "");
  }
}

function distinctImages(product) {
  const seen = new Set();
  return [product.imageUrl, ...(product.images || [])].filter((url) => {
    if (!url || typeof url !== "string" || !url.trim()) return false;
    const key = identity(url);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

const sha1 = (buf) => createHash("sha1").update(buf).digest("hex");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let placeholder = null; // { size, hash }
async function loadPlaceholderSignature() {
  const r = await fetch(KNOWN_PLACEHOLDER_URL, { headers: HEADERS, signal: AbortSignal.timeout(20000) });
  const buf = Buffer.from(await r.arrayBuffer());
  placeholder = { size: buf.length, hash: sha1(buf) };
  console.log(`Placeholder "JS" de Jomashop: ${placeholder.size} bytes · sha1 ${placeholder.hash.slice(0, 12)}…`);
}

// Veredictos: "real" (confirmada) · "dead" (placeholder o 404) · "unknown" (no verificable)
const probeCache = new Map();
async function verdict(url) {
  if (url.startsWith("/")) return "real"; // asset local servido por Next
  const key = identity(url);
  if (probeCache.has(key)) return probeCache.get(key);
  const promise = (async () => {
    for (let attempt = 0; attempt < 3; attempt++) {
      if (attempt) await sleep(800 * attempt);
      try {
        const response = await fetch(url, {
          headers: HEADERS,
          redirect: "follow",
          signal: AbortSignal.timeout(20000)
        });
        if (response.status === 404 || response.status === 410) {
          await response.body?.cancel();
          return "dead";
        }
        const type = response.headers.get("content-type") || "";
        if (!response.ok || !type.startsWith("image/")) {
          await response.body?.cancel();
          continue; // 403/429/5xx o HTML: reintenta y, si persiste, "unknown"
        }
        if (isJomashop(url)) {
          const buf = Buffer.from(await response.arrayBuffer());
          const isPlaceholder = buf.length === placeholder.size && sha1(buf) === placeholder.hash;
          return isPlaceholder ? "dead" : "real";
        }
        await response.body?.cancel();
        return "real";
      } catch {
        /* red inestable: reintenta */
      }
    }
    return "unknown";
  })();
  probeCache.set(key, promise);
  return promise;
}

await loadPlaceholderSignature();

const targets = catalog.products.filter((p) => types.has(p.type));
console.log(`Verificando ${targets.length} productos (${[...types].join(", ")})…`);

let reordered = 0;
let removedUrls = 0;
let unknownKept = 0;
let noneReal = 0;
const queue = [...targets];

await Promise.all(Array.from({ length: concurrency }, async () => {
  while (queue.length) {
    const product = queue.shift();
    const images = distinctImages(product);
    const verdicts = await Promise.all(images.map((url) => verdict(url)));
    const real = images.filter((_, i) => verdicts[i] === "real");
    const unknown = images.filter((_, i) => verdicts[i] === "unknown");
    const dead = verdicts.filter((v) => v === "dead").length;
    // Confirmadas primero (la principal siempre es una foto real si existe);
    // las no verificables se conservan al final por si el CDN vuelve.
    const ordered = [...real, ...unknown];

    if (!ordered.length) {
      noneReal++;
      console.warn(`✗ ${product.id} (${product.brand} · ${product.name}) — sin imágenes utilizables`);
      continue;
    }
    if (!real.length) noneReal++;
    unknownKept += unknown.length;
    if (dead > 0 || ordered[0] !== product.imageUrl) {
      if (ordered[0] !== product.imageUrl) reordered++;
      removedUrls += dead;
      console.log(`✓ ${product.id} — ${images.length} → ${ordered.length} imágenes (${real.length} confirmadas${unknown.length ? `, ${unknown.length} sin verificar` : ""})${ordered[0] !== product.imageUrl ? " · nueva principal" : ""}`);
    }
    product.imageUrl = ordered[0];
    product.images = ordered.slice(1);
  }
}));

writeFileSync(catalogPath, JSON.stringify(catalog, null, 2));
console.log(`\nListo: ${reordered} con nueva imagen principal · ${removedUrls} placeholders/404 eliminados · ${unknownKept} sin verificar conservadas · ${noneReal} productos sin foto confirmada.`);
