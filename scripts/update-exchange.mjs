// ============================================================
//  Actualiza SÓLO el tipo de cambio (venta Kambista + markup).
//  - Reescribe el campo exchange en data/catalog.json
//  - Si hay DATABASE_URL, actualiza la tabla settings en Neon
//  Útil para un cron diario sin re-scrapear todo.
// ============================================================

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { getExchangeRate } from "../lib/exchange.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

async function main() {
  const ex = await getExchangeRate();
  console.log(`Venta ${ex.sell} + ${ex.markup} => S/ ${ex.rate} (${ex.source})`);

  // 1) catalog.json
  const jsonPath = resolve(ROOT, "data/catalog.json");
  try {
    const cat = JSON.parse(readFileSync(jsonPath, "utf8"));
    cat.exchange = ex;
    writeFileSync(jsonPath, JSON.stringify(cat, null, 2), "utf8");
    console.log("✓ catalog.json actualizado");
  } catch (e) {
    console.warn("catalog.json no actualizado:", e.message);
  }

  // 2) Neon (opcional)
  if (process.env.DATABASE_URL) {
    const { neon } = await import("@neondatabase/serverless");
    const sql = neon(process.env.DATABASE_URL);
    const rows = [
      ["exchange_rate", String(ex.rate)],
      ["exchange_sell", String(ex.sell)],
      ["exchange_markup", String(ex.markup)],
      ["exchange_source", ex.source],
      ["exchange_fetched_at", ex.fetchedAt]
    ];
    for (const [k, v] of rows) {
      await sql`INSERT INTO settings(key, value) VALUES (${k}, ${v})
                ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`;
    }
    console.log("✓ Neon settings actualizado");
  } else {
    console.log("(sin DATABASE_URL: se omite Neon)");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
