import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Verifica contra el CDN cada imagen de los productos y reescribe el catálogo
 * dejando solo las URLs que realmente cargan:
 *   - imageUrl pasa a ser la PRIMERA imagen alcanzable (aunque fuera la 3ª o 4ª).
 *   - Las URLs muertas o que no devuelven image/* se eliminan del array.
 * Uso: node scripts/fix-product-images.mjs            (perfume por defecto)
 *      FIX_IMAGE_TYPES=perfume,watch node scripts/fix-product-images.mjs
 */
const catalogPath = resolve("data/catalog.json");
const catalog = JSON.parse(readFileSync(catalogPath, "utf8"));
const types = new Set(
  String(process.env.FIX_IMAGE_TYPES || "perfume")
    .split(",").map((v) => v.trim()).filter(Boolean)
);
const concurrency = Math.max(1, Number(process.env.FIX_IMAGE_CONCURRENCY || 16));
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36";

function identity(value) {
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

const probeCache = new Map();
async function reachable(url) {
  if (url.startsWith("/")) return true; // asset local servido por Next
  const key = identity(url);
  if (probeCache.has(key)) return probeCache.get(key);
  const promise = (async () => {
    const origin = (() => {
      try { return `${new URL(url).origin}/`; } catch { return ""; }
    })();
    for (const referer of ["", origin]) {
      try {
        const response = await fetch(url, {
          headers: {
            "user-agent": UA,
            accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
            range: "bytes=0-32767",
            ...(referer ? { referer } : {})
          },
          redirect: "follow",
          signal: AbortSignal.timeout(15000)
        });
        const type = response.headers.get("content-type") || "";
        await response.body?.cancel();
        if ((response.ok || response.status === 416) && type.startsWith("image/")) return true;
        if (referer) return false;
      } catch {
        if (referer) return false;
      }
    }
    return false;
  })();
  probeCache.set(key, promise);
  return promise;
}

const targets = catalog.products.filter((p) => types.has(p.type));
console.log(`Verificando ${targets.length} productos (${[...types].join(", ")})…`);

let reordered = 0;
let removedUrls = 0;
let noneLeft = 0;
const queue = [...targets];

await Promise.all(Array.from({ length: concurrency }, async () => {
  while (queue.length) {
    const product = queue.shift();
    const images = distinctImages(product);
    const checks = await Promise.all(images.map((url) => reachable(url)));
    const alive = images.filter((_, i) => checks[i]);
    const dead = images.length - alive.length;

    if (!alive.length) {
      noneLeft++;
      console.warn(`✗ ${product.id} (${product.brand} · ${product.name}) — sin ninguna imagen alcanzable`);
      continue;
    }
    if (dead > 0 || alive[0] !== product.imageUrl) {
      if (alive[0] !== product.imageUrl) reordered++;
      removedUrls += dead;
      console.log(`✓ ${product.id} — ${images.length} → ${alive.length} imágenes${alive[0] !== product.imageUrl ? " (nueva principal)" : ""}`);
    }
    product.imageUrl = alive[0];
    product.images = alive.slice(1);
  }
}));

writeFileSync(catalogPath, JSON.stringify(catalog, null, 2));
console.log(`\nListo: ${reordered} productos con nueva imagen principal, ${removedUrls} URLs muertas eliminadas, ${noneLeft} sin imágenes válidas.`);
