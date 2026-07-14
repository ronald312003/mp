-- ============================================================
--  Maison Privée — Esquema de base de datos (Neon / PostgreSQL)
--  Ejecuta este script UNA vez en Neon (SQL Editor), y luego
--  ejecuta db/seed.sql para cargar los productos.
-- ============================================================

-- Colecciones: NO son categorías clásicas, sino outfits / estilos /
-- temporadas (Lujo Silencioso, Elegante, Casual, Oficina, Noche,
-- Verano, Invierno, Deportivo).
CREATE TABLE IF NOT EXISTS collections (
  slug        TEXT PRIMARY KEY,
  title       TEXT NOT NULL,
  subtitle    TEXT,
  description  TEXT,
  kind        TEXT NOT NULL DEFAULT 'style',   -- style | season | occasion
  hero_image  TEXT,
  sort_order  INT  NOT NULL DEFAULT 100
);

-- Productos (relojes, perfumes, ropa, zapatos).
CREATE TABLE IF NOT EXISTS products (
  id              TEXT PRIMARY KEY,             -- p.ej. jomashop-se-ssb425p1
  source          TEXT NOT NULL,               -- jomashop | theoutnet
  source_id       TEXT NOT NULL,               -- sku / partNumber
  name            TEXT NOT NULL,
  brand           TEXT NOT NULL,
  type            TEXT NOT NULL,               -- watch | perfume | clothing | shoes
  gender          TEXT NOT NULL DEFAULT 'unisex', -- men | women | unisex
  description     TEXT,
  image_url       TEXT NOT NULL,
  source_url      TEXT,
  base_price_usd  NUMERIC(10,2) NOT NULL,      -- precio origen (Jomashop/TheOutnet)
  final_price_usd NUMERIC(10,2) NOT NULL,      -- precio de venta calculado (base + markup)
  price_override_usd NUMERIC(10,2),            -- precio manual del admin (si se define, manda)
  styling_note      TEXT,                      -- IA: cómo complementar / armar el look
  inspiration_image TEXT,                      -- imagen de referencia del estilo
  images          TEXT[],                      -- galería (varias fotos del producto)
  reco_ids        TEXT[],                      -- "completa el look" (en unisex = para él)
  reco_note       TEXT,                        -- explicación elegante de la recomendación
  reco_context    TEXT,                        -- slug de colección que ambienta la recomendación
  reco_ids_w      TEXT[],                      -- unisex: look para ella
  reco_note_w     TEXT,
  reco_context_w  TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Idempotente: si la tabla ya existía de una versión anterior, añade las
-- columnas nuevas sin romper nada (seguro de re-ejecutar).
ALTER TABLE products ADD COLUMN IF NOT EXISTS price_override_usd NUMERIC(10,2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS styling_note TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS inspiration_image TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS images TEXT[];
ALTER TABLE products ADD COLUMN IF NOT EXISTS reco_ids TEXT[];
ALTER TABLE products ADD COLUMN IF NOT EXISTS reco_note TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS reco_context TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS reco_ids_w TEXT[];
ALTER TABLE products ADD COLUMN IF NOT EXISTS reco_note_w TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS reco_context_w TEXT;

CREATE INDEX IF NOT EXISTS idx_products_type   ON products(type);
CREATE INDEX IF NOT EXISTS idx_products_brand  ON products(brand);
CREATE INDEX IF NOT EXISTS idx_products_gender ON products(gender);
CREATE INDEX IF NOT EXISTS idx_products_price  ON products(final_price_usd);

-- Relación N:N producto <-> colección.
CREATE TABLE IF NOT EXISTS product_collections (
  product_id      TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  collection_slug TEXT NOT NULL REFERENCES collections(slug) ON DELETE CASCADE,
  PRIMARY KEY (product_id, collection_slug)
);

CREATE INDEX IF NOT EXISTS idx_pc_collection ON product_collections(collection_slug);

-- Ajustes clave/valor: tipo de cambio (venta Kambista + markup), fecha de
-- generación, etc. La app lee 'exchange_rate' para mostrar precios en soles.
CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
