import "server-only";
import { getSql } from "./db";
import type { Catalog, Collection, Product } from "./types";
import fallbackCatalog from "@/data/catalog.json";

// Cache en memoria por proceso (se refresca en cada cold start / redeploy).
let cache: { at: number; data: Catalog } | null = null;
const TTL_MS = 5 * 60 * 1000;

/** Invalida la caché en memoria (llamar tras crear/editar/eliminar). */
export function invalidateCatalog() {
  cache = null;
}

/**
 * Devuelve el catálogo completo. Usa Neon si DATABASE_URL está definida;
 * si no, cae al JSON horneado por el scraper (permite previsualizar sin BD).
 */
export async function getCatalog(): Promise<Catalog> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.data;

  const sql = getSql();
  if (!sql) {
    const data = fallbackCatalog as unknown as Catalog;
    cache = { at: Date.now(), data };
    return data;
  }

  try {
    const [collRows, prodRows, settingRows] = await Promise.all([
      sql`SELECT slug, title, subtitle, description, kind, hero_image
          FROM collections ORDER BY sort_order ASC, title ASC`,
      sql`SELECT p.id, p.source, p.source_id, p.name, p.brand, p.type, p.gender,
                 p.description, p.image_url, p.source_url,
                 p.base_price_usd, p.final_price_usd, p.price_override_usd,
                 p.styling_note, p.inspiration_image,
                 COALESCE(
                   (SELECT array_agg(pc.collection_slug)
                    FROM product_collections pc WHERE pc.product_id = p.id),
                   ARRAY[]::text[]
                 ) AS collections
          FROM products p
          ORDER BY p.final_price_usd ASC`,
      sql`SELECT key, value FROM settings`
    ]);

    const settings = Object.fromEntries(
      (settingRows as any[]).map((r) => [r.key, r.value])
    );

    const collections: Collection[] = (collRows as any[]).map((r) => ({
      slug: r.slug,
      title: r.title,
      subtitle: r.subtitle,
      description: r.description,
      kind: r.kind,
      heroImage: r.hero_image
    }));

    const products: Product[] = (prodRows as any[]).map((r) => {
      const override = r.price_override_usd != null ? Number(r.price_override_usd) : null;
      return {
        id: r.id,
        source: r.source,
        sourceId: r.source_id,
        name: r.name,
        brand: r.brand,
        type: r.type,
        gender: r.gender,
        description: r.description,
        imageUrl: r.image_url,
        sourceUrl: r.source_url,
        basePriceUsd: Number(r.base_price_usd),
        finalPriceUsd: override ?? Number(r.final_price_usd), // override manda
        priceOverrideUsd: override,
        collections: r.collections ?? [],
        stylingNote: r.styling_note ?? null,
        inspirationImage: r.inspiration_image ?? null
      };
    });

    const data: Catalog = {
      generatedAt: settings.generated_at ?? new Date().toISOString(),
      exchange: {
        rate: Number(settings.exchange_rate ?? 3.51),
        sell: Number(settings.exchange_sell ?? 3.41),
        markup: Number(settings.exchange_markup ?? 0.1),
        source: settings.exchange_source ?? "db",
        fetchedAt: settings.exchange_fetched_at ?? new Date().toISOString()
      },
      collections,
      products
    };

    cache = { at: Date.now(), data };
    return data;
  } catch (err) {
    console.error("[data] fallo al leer Neon, usando catálogo horneado:", err);
    const data = fallbackCatalog as unknown as Catalog;
    cache = { at: Date.now(), data };
    return data;
  }
}

export async function getExchange() {
  return (await getCatalog()).exchange;
}

export async function getCollections(): Promise<Collection[]> {
  return (await getCatalog()).collections;
}

export async function getCollection(slug: string): Promise<Collection | undefined> {
  return (await getCatalog()).collections.find((c) => c.slug === slug);
}

export async function getProducts(): Promise<Product[]> {
  return (await getCatalog()).products;
}

export async function getProduct(id: string): Promise<Product | undefined> {
  return (await getCatalog()).products.find((p) => p.id === id);
}

export async function getProductsByCollection(slug: string): Promise<Product[]> {
  return (await getCatalog()).products.filter((p) => p.collections.includes(slug));
}

/**
 * Productos para "completar el look": de OTRAS categorías (tipos) que comparten
 * colecciones con el producto dado. Devuelve variedad de tipos, mejor match primero.
 */
export async function getComplements(product: Product, limit = 3): Promise<Product[]> {
  const all = (await getCatalog()).products;
  const set = new Set(product.collections);
  const scored = all
    .filter((p) => p.id !== product.id && p.type !== product.type)
    .map((p) => ({ p, overlap: p.collections.filter((c) => set.has(c)).length, gender: p.gender }))
    .filter((x) => x.overlap > 0)
    // preferir mismo género o unisex
    .sort(
      (a, b) =>
        b.overlap - a.overlap ||
        (matchGender(b.gender, product.gender) ? 1 : 0) - (matchGender(a.gender, product.gender) ? 1 : 0)
    );

  // Diversificar por tipo: un producto por tipo distinto primero.
  const out: Product[] = [];
  const usedTypes = new Set<string>();
  for (const { p } of scored) {
    if (usedTypes.has(p.type)) continue;
    out.push(p);
    usedTypes.add(p.type);
    if (out.length >= limit) break;
  }
  // Rellenar si faltan.
  if (out.length < limit) {
    for (const { p } of scored) {
      if (out.find((x) => x.id === p.id)) continue;
      out.push(p);
      if (out.length >= limit) break;
    }
  }
  return out;
}

function matchGender(a: string, b: string) {
  return a === b || a === "unisex" || b === "unisex";
}
