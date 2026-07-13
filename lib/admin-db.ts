import "server-only";
import { getSql } from "./db";
// @ts-ignore — módulo .mjs sin tipos
import { finalPriceUsd } from "./pricing.mjs";
// @ts-ignore — módulo .mjs sin tipos
import { searchProductImage } from "./image-search.mjs";
// @ts-ignore — módulo .mjs sin tipos
import { classifyOne } from "./ai-classify.mjs";
import type { ProductType, Gender } from "./types";

// Imagen neutral si no se da URL y la búsqueda web falla.
const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&w=900&q=80";

// Si no hay imagen, la busca en internet (primera imagen real más cercana).
async function resolveImage(input: ProductInput): Promise<string> {
  if (input.imageUrl) return input.imageUrl;
  const found = await searchProductImage(`${input.brand} ${input.name}`);
  return found || FALLBACK_IMAGE;
}

export interface ProductInput {
  name: string;
  brand: string;
  type: ProductType;
  gender: Gender;
  description: string | null;
  imageUrl: string;
  sourceUrl: string | null;
  basePriceUsd: number;
  priceOverrideUsd: number | null; // precio de venta manual (si se define, manda)
  collections: string[];
}

// Si el admin no eligió colecciones o no escribió descripción, las genera la IA.
async function enrichWithAI(input: ProductInput): Promise<{ collections: string[]; description: string | null }> {
  const needsCollections = !input.collections.length;
  const needsDescription = !input.description;
  if (!needsCollections && !needsDescription) {
    return { collections: input.collections, description: input.description };
  }
  const ai = await classifyOne({ brand: input.brand, name: input.name, type: input.type });
  return {
    collections: needsCollections && ai?.collections?.length ? ai.collections : input.collections,
    description: needsDescription && ai?.description ? ai.description : input.description
  };
}

function requireSql() {
  const sql = getSql();
  if (!sql) {
    throw new Error(
      "No hay conexión a base de datos. Define DATABASE_URL (Neon) para administrar productos."
    );
  }
  return sql;
}

function makeId(brand: string, name: string): string {
  const slug = `${brand}-${name}`
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
  const rand = Math.random().toString(36).slice(2, 7);
  return `mp-${slug}-${rand}`;
}

export async function createProduct(input: ProductInput): Promise<string> {
  const sql = requireSql();
  const id = makeId(input.brand, input.name);
  const finalUsd = finalPriceUsd(input.basePriceUsd);
  const imageUrl = await resolveImage(input);
  const ai = await enrichWithAI(input);

  await sql`
    INSERT INTO products (id, source, source_id, name, brand, type, gender,
                          description, image_url, source_url, base_price_usd, final_price_usd, price_override_usd)
    VALUES (${id}, 'admin', ${id}, ${input.name}, ${input.brand}, ${input.type}, ${input.gender},
            ${ai.description}, ${imageUrl}, ${input.sourceUrl},
            ${input.basePriceUsd}, ${finalUsd}, ${input.priceOverrideUsd})
  `;
  await setCollections(id, ai.collections);
  return id;
}

export async function updateProduct(id: string, input: ProductInput): Promise<void> {
  const sql = requireSql();
  const finalUsd = finalPriceUsd(input.basePriceUsd);
  const imageUrl = await resolveImage(input);
  const ai = await enrichWithAI(input);

  await sql`
    UPDATE products SET
      name = ${input.name},
      brand = ${input.brand},
      type = ${input.type},
      gender = ${input.gender},
      description = ${ai.description},
      image_url = ${imageUrl},
      source_url = ${input.sourceUrl},
      base_price_usd = ${input.basePriceUsd},
      final_price_usd = ${finalUsd},
      price_override_usd = ${input.priceOverrideUsd}
    WHERE id = ${id}
  `;
  await setCollections(id, ai.collections);
}

export async function deleteProduct(id: string): Promise<void> {
  const sql = requireSql();
  await sql`DELETE FROM products WHERE id = ${id}`;
}

async function setCollections(productId: string, slugs: string[]) {
  const sql = requireSql();
  await sql`DELETE FROM product_collections WHERE product_id = ${productId}`;
  for (const slug of slugs) {
    await sql`
      INSERT INTO product_collections (product_id, collection_slug)
      VALUES (${productId}, ${slug})
      ON CONFLICT DO NOTHING
    `;
  }
}
