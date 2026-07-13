// Regenera db/seed.sql a partir de data/catalog.json (sin volver a scrapear).
// Útil si cambiaste la lógica del SQL o quieres el script sin esperar el scrape.
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { buildSeedSql } from "./seed-sql.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const catalog = JSON.parse(readFileSync(resolve(ROOT, "data/catalog.json"), "utf8"));
writeFileSync(resolve(ROOT, "db/seed.sql"), buildSeedSql(catalog), "utf8");
console.log(`✓ db/seed.sql regenerado (${catalog.products.length} productos)`);
