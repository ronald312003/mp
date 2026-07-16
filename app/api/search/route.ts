import { NextResponse } from "next/server";
import { getCatalog } from "@/lib/data";
import { productImageSrc } from "@/lib/product-images";
import { FASHION_HOUSES } from "@/lib/fashion-houses";
import { houseSlug } from "@/lib/house-media";

export const dynamic = "force-dynamic";

/** Normaliza para buscar sin acentos ni mayúsculas. */
const fold = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

const TYPE_LABEL: Record<string, string> = {
  watch: "Reloj",
  perfume: "Perfume",
  clothing: "Ropa",
  shoes: "Calzado"
};

/**
 * Búsqueda global: piezas del catálogo + casas de moda.
 * GET /api/search?q=louboutin → { products: [...], houses: [...] }
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = fold((searchParams.get("q") || "").trim()).slice(0, 60);
  if (q.length < 2) return NextResponse.json({ products: [], houses: [] });

  const terms = q.split(/\s+/).filter(Boolean);
  const { products } = await getCatalog();

  const matches = products
    .map((product) => {
      const haystack = fold(`${product.brand} ${product.name} ${TYPE_LABEL[product.type] || product.type}`);
      if (!terms.every((term) => haystack.includes(term))) return null;
      // Prioriza coincidencia por marca (lo más buscado) y luego por nombre.
      const score = (fold(product.brand).includes(q) ? 2 : 0) + (fold(product.name).startsWith(q) ? 1 : 0);
      return { product, score };
    })
    .filter((entry): entry is { product: (typeof products)[number]; score: number } => entry !== null)
    .sort((a, b) => b.score - a.score)
    .slice(0, 9)
    .map(({ product }) => ({
      id: product.id,
      brand: product.brand,
      name: product.name,
      type: TYPE_LABEL[product.type] || product.type,
      priceUsd: product.finalPriceUsd,
      img: productImageSrc(product)
    }));

  const houses = FASHION_HOUSES.filter((house) =>
    terms.every((term) => fold(`${house.name} ${house.identity}`).includes(term))
  )
    .slice(0, 4)
    .map((house) => ({
      name: house.name,
      identity: house.identity,
      slug: houseSlug(house.name)
    }));

  return NextResponse.json({ products: matches, houses });
}
