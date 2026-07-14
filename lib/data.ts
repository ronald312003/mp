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
    const fallback = fallbackCatalog as unknown as Catalog;
    const data = {
      ...fallback,
      products: fallback.products.filter(
        (p) => !(p.type === "perfume" && p.basePriceUsd < 120)
      )
    };
    cache = { at: Date.now(), data };
    return data;
  }

  try {
    const [collRows, prodRows, settingRows] = await Promise.all([
      sql`SELECT slug, title, subtitle, description, kind, hero_image
          FROM collections ORDER BY sort_order ASC, title ASC`,
      sql`SELECT p.id, p.source, p.source_id, p.name, p.brand, p.type, p.gender,
                 p.description, p.image_url, p.images, p.source_url,
                 p.base_price_usd, p.final_price_usd, p.price_override_usd,
                 p.styling_note, p.inspiration_image,
                 p.reco_ids, p.reco_note, p.reco_context,
                 p.reco_ids_w, p.reco_note_w, p.reco_context_w,
                 COALESCE(
                   (SELECT array_agg(pc.collection_slug)
                    FROM product_collections pc WHERE pc.product_id = p.id),
                   ARRAY[]::text[]
                 ) AS collections
          FROM products p
          WHERE NOT (p.type = 'perfume' AND p.base_price_usd < 120)
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

    const storedProducts: Product[] = (prodRows as any[]).map((r) => {
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
        inspirationImage: r.inspiration_image ?? null,
        images: r.images ?? undefined,
        recoIds: r.reco_ids ?? undefined,
        recoNote: r.reco_note ?? null,
        recoContext: r.reco_context ?? null,
        recoIdsW: r.reco_ids_w ?? undefined,
        recoNoteW: r.reco_note_w ?? null,
        recoContextW: r.reco_context_w ?? null
      };
    });

    // El catálogo scrapeado que viaja con cada deploy es la fuente canónica.
    // Neon conserva los productos creados en admin y los overrides de precio.
    // Esto evita servir un catálogo scrapeado antiguo si una rama/seed de la BD
    // quedó desfasada, sin perder las modificaciones manuales importantes.
    const baked = (fallbackCatalog as unknown as Catalog).products.filter(
      (p) => !(p.type === "perfume" && p.basePriceUsd < 120)
    );
    const storedById = new Map(storedProducts.map((p) => [p.id, p]));
    const bakedIds = new Set(baked.map((p) => p.id));
    const products: Product[] = baked.map((p) => {
      const stored = storedById.get(p.id);
      const override = stored?.priceOverrideUsd ?? null;
      return {
        ...p,
        priceOverrideUsd: override,
        finalPriceUsd: override ?? p.finalPriceUsd
      };
    });
    products.push(
      ...storedProducts.filter((p) => p.source === "admin" && !bakedIds.has(p.id))
    );
    products.sort((a, b) => a.finalPriceUsd - b.finalPriceUsd);

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
    const fallback = fallbackCatalog as unknown as Catalog;
    const data = {
      ...fallback,
      products: fallback.products.filter(
        (p) => !(p.type === "perfume" && p.basePriceUsd < 120)
      )
    };
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
 * Productos para "completar el look".
 * 1º: la selección hecha por la IA sobre el catálogo real (recoIds / recoIdsW).
 * 2º (respaldo): otras categorías que comparten colecciones con el producto.
 * `audience` fija el destinatario del look: "m" (él) o "w" (ella); útil para
 * productos unisex, que llevan un look por cada género.
 */
export async function getComplements(
  product: Product,
  limit = 3,
  audience: "m" | "w" = "m"
): Promise<Product[]> {
  const all = (await getCatalog()).products;

  const targetGender = audience === "w" ? "women" : product.gender === "women" ? "women" : product.gender === "men" ? "men" : "men";
  const ids = audience === "w" && product.recoIdsW?.length ? product.recoIdsW : product.recoIds;

  const recommended = ids?.length
    ? ids
      .map((id) => all.find((p) => p.id === id))
      .filter(
        (p): p is Product =>
          p !== undefined &&
          p.id !== product.id &&
          p.type !== product.type &&
          matchGender(p.gender, targetGender)
      )
      .slice(0, limit)
    : [];
  if (recommended.length >= limit) return recommended;

  const set = new Set(product.collections);
  const preferredTypes: Record<string, string[]> = {
    clothing: ["shoes", "watch", "perfume"],
    shoes: ["clothing", "watch", "perfume"],
    watch: ["clothing", "shoes", "perfume"],
    perfume: ["clothing", "shoes", "watch"]
  };
  const order = preferredTypes[product.type] || ["clothing", "shoes", "watch", "perfume"];
  const scored = all
    .filter(
      (p) =>
        p.id !== product.id &&
        p.type !== product.type &&
        matchGender(p.gender, targetGender)
    )
    .map((p) => ({
      p,
      overlap: p.collections.filter((c) => set.has(c)).length,
      exactGender: p.gender === targetGender ? 1 : 0,
      typeRank: order.indexOf(p.type) === -1 ? order.length : order.indexOf(p.type)
    }))
    .filter((x) => x.overlap > 0)
    .sort(
      (a, b) =>
        b.overlap - a.overlap ||
        b.exactGender - a.exactGender ||
        a.typeRank - b.typeRank ||
        Math.abs(product.finalPriceUsd - a.p.finalPriceUsd) -
          Math.abs(product.finalPriceUsd - b.p.finalPriceUsd)
    );

  // Diversificar por tipo: un producto por tipo distinto primero.
  const out: Product[] = [...recommended];
  const usedTypes = new Set(out.map((p) => p.type));
  for (const { p } of scored) {
    if (usedTypes.has(p.type) || out.some((item) => item.id === p.id)) continue;
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
