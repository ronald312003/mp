import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildSeedSql } from "./seed-sql.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const MEDIA_PATH = resolve(ROOT, "data/official-product-media.json");

const readMedia = () => JSON.parse(readFileSync(MEDIA_PATH, "utf8"));

/**
 * Adjunta fotografías del fabricante solo con triple coincidencia:
 * sourceId estable + marca/tipo + texto distintivo del producto.
 * Así una búsqueda genérica nunca puede mezclar otra talla, variante o género.
 */
export function enrichOfficialProductMedia(products) {
  const media = readMedia();
  let attached = 0;

  for (const product of products) {
    const official = media[String(product.sourceId)];
    if (!official?.images?.length) continue;
    const exact =
      product.brand === official.brand &&
      product.type === official.type &&
      product.name.toLowerCase().includes(official.nameIncludes.toLowerCase());
    if (!exact) continue;

    const existing = [product.imageUrl, ...(product.images || [])].filter(Boolean);
    const generated = existing.filter((url) => String(url).startsWith(`/generated/${product.id}-ai-`));
    product.imageUrl = official.images[0];
    product.images = [...new Set([...official.images, ...existing.filter((url) => !generated.includes(url)), ...generated])].slice(0, 7);
    attached++;
  }

  console.log(`  · fragancias: ${attached} referencias con medios oficiales exactos`);
  return attached;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const catalogPath = resolve(ROOT, "data/catalog.json");
  const seedPath = resolve(ROOT, "db/seed.sql");
  const catalog = JSON.parse(readFileSync(catalogPath, "utf8"));
  enrichOfficialProductMedia(catalog.products);
  catalog.generatedAt = new Date().toISOString();
  writeFileSync(catalogPath, JSON.stringify(catalog, null, 2), "utf8");
  writeFileSync(seedPath, buildSeedSql(catalog), "utf8");
  console.log("✓ data/catalog.json y db/seed.sql sincronizados");
}
