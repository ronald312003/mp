import { NextResponse } from "next/server";
// @ts-ignore — módulo .mjs compartido
import { getExchangeRate } from "@/lib/exchange.mjs";
import { getSql } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Devuelve el tipo de cambio actual (venta Kambista + markup).
 * Si se pasa ?persist=1 y hay DATABASE_URL, lo guarda en settings.
 * Protegible con ?token=REVALIDATE_TOKEN.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const persist = url.searchParams.get("persist") === "1";
  const token = url.searchParams.get("token");

  const ex = await getExchangeRate();

  if (persist) {
    const required = process.env.REVALIDATE_TOKEN;
    if (required && token !== required) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    const sql = getSql();
    if (sql) {
      const rows = [
        ["exchange_rate", String(ex.rate)],
        ["exchange_sell", String(ex.sell)],
        ["exchange_markup", String(ex.markup)],
        ["exchange_source", ex.source],
        ["exchange_fetched_at", ex.fetchedAt]
      ] as const;
      for (const [k, v] of rows) {
        await sql`INSERT INTO settings(key, value) VALUES (${k}, ${v})
                  ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`;
      }
    }
  }

  return NextResponse.json(ex);
}
