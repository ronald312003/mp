import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

// Cliente Neon (serverless-friendly). Es null si no hay DATABASE_URL,
// en cuyo caso la app cae al catálogo horneado en data/catalog.json.
let _sql: NeonQueryFunction<false, false> | null = null;

export function getSql(): NeonQueryFunction<false, false> | null {
  if (_sql) return _sql;
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  _sql = neon(url);
  return _sql;
}

export const hasDatabase = () => Boolean(process.env.DATABASE_URL);
