// ============================================================
//  Aplica db/schema.sql y db/seed.sql a la base Neon.
//  Requiere DATABASE_URL en el entorno (.env.local).
//
//  Uso:
//    DATABASE_URL="postgres://..." node scripts/db-apply.mjs
//    (o define DATABASE_URL en .env.local y córrelo con dotenv)
// ============================================================

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("Falta DATABASE_URL. Ej: DATABASE_URL='postgres://...' node scripts/db-apply.mjs");
    process.exit(1);
  }

  const schema = readFileSync(resolve(ROOT, "db/schema.sql"), "utf8");
  const seed = readFileSync(resolve(ROOT, "db/seed.sql"), "utf8");

  const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  await client.connect();
  console.log("Conectado a Neon.");

  console.log("→ Aplicando schema.sql…");
  await client.query(schema);

  console.log("→ Aplicando seed.sql…");
  await client.query(seed);

  const { rows } = await client.query("SELECT count(*)::int AS n FROM products");
  console.log(`✓ Listo. Productos en la base: ${rows[0].n}`);

  await client.end();
}

main().catch((e) => {
  console.error("Error:", e.message);
  process.exit(1);
});
