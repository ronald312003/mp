// ============================================================
//  Aplica db/schema.sql y db/seed.sql a la base Neon.
//  Requiere DATABASE_URL en el entorno (.env.local).
//
//  Uso:
//    DATABASE_URL="postgres://..." node scripts/db-apply.mjs
//    (o define DATABASE_URL en .env.local y córrelo con dotenv)
// ============================================================

import "./load-env.mjs";
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

  const reset = process.argv.includes("--reset");
  if (reset) {
    console.log("→ Vaciando catálogo anterior…");
  }

  console.log("→ Aplicando seed.sql…");
  if (reset) {
    // seed.sql ya trae BEGIN/COMMIT. Los retiramos para envolver limpieza +
    // seed en una sola transacción. DELETE (no TRUNCATE CASCADE) conserva el
    // historial de order_items y deja product_id en NULL mediante la FK.
    const seedBody = seed
      .replace(/(^|\r?\n)BEGIN;\s*(\r?\n)/, "$1")
      .replace(/\r?\nCOMMIT;\s*$/, "\n");
    await client.query(
      `BEGIN;\nDELETE FROM product_collections;\nDELETE FROM products;\n${seedBody}\nCOMMIT;`
    );
  } else {
    await client.query(seed);
  }

  const { rows } = await client.query(`
    SELECT
      count(*)::int AS total,
      count(*) FILTER (WHERE gender = 'men')::int AS men,
      count(*) FILTER (WHERE gender = 'men' AND type = 'clothing')::int AS men_clothing,
      count(*) FILTER (WHERE gender = 'men' AND type = 'shoes')::int AS men_shoes,
      count(*) FILTER (WHERE type = 'perfume' AND base_price_usd < 120)::int AS low_perfumes
    FROM products
  `);
  const stats = rows[0];
  console.log(
    `✓ Base verificada: ${stats.total} productos · hombre ${stats.men} ` +
      `(ropa ${stats.men_clothing}, zapatos ${stats.men_shoes}) · ` +
      `perfumes bajo $120: ${stats.low_perfumes}`
  );

  await client.end();
}

main().catch((e) => {
  console.error("Error:", e.message);
  process.exit(1);
});
