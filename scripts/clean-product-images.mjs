import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const catalog = JSON.parse(readFileSync(resolve("data/catalog.json"), "utf8"));

function normalizeImageUrl(value) {
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

function cleanProductImages(product) {
  const seen = new Set();
  const cleaned = [];

  for (const url of [product.imageUrl, ...(product.images || [])]) {
    if (!url || typeof url !== "string" || url.trim() === "") continue;
    const normalized = normalizeImageUrl(url);
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    cleaned.push(url);
  }

  return cleaned;
}

let updated = 0;
let removed = 0;

for (const product of catalog.products) {
  const cleaned = cleanProductImages(product);
  const originalImageUrl = product.imageUrl;
  const originalImagesCount = (product.images || []).length;
  const cleanedImagesCount = cleaned.length;

  if (cleanedImagesCount === 0) {
    console.warn(`⚠️  Producto ${product.id} (${product.brand} ${product.name}) NO tiene imágenes válidas`);
  }

  if (cleaned.length > 0) {
    product.imageUrl = cleaned[0];
    product.images = cleaned.slice(1);

    if (
      cleaned[0] !== originalImageUrl ||
      cleaned.slice(1).length !== originalImagesCount
    ) {
      updated++;
      if (originalImagesCount !== cleanedImagesCount) {
        removed += originalImagesCount - cleanedImagesCount;
        console.log(
          `✓ ${product.id}: ${originalImagesCount} → ${cleanedImagesCount} imágenes (removidas ${originalImagesCount - cleanedImagesCount})`
        );
      }
    }
  }
}

writeFileSync(
  resolve("data/catalog.json"),
  JSON.stringify(catalog, null, 2)
);

console.log(`\n✨ Limpieza completada:`);
console.log(`   Productos actualizados: ${updated}`);
console.log(`   URLs inválidas removidas: ${removed}`);
