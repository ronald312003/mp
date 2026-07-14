export type ProductType = "watch" | "perfume" | "clothing" | "shoes";
export type Gender = "men" | "women" | "unisex";

export interface Product {
  id: string;
  source: "jomashop" | "theoutnet" | "admin";
  sourceId: string;
  name: string;
  brand: string;
  type: ProductType;
  gender: Gender;
  description: string | null;
  imageUrl: string;
  sourceUrl: string | null;
  basePriceUsd: number;
  finalPriceUsd: number; // precio mostrado (override del admin si existe, si no el calculado)
  priceOverrideUsd?: number | null; // precio manual del admin (solo para el panel)
  collections: string[]; // slugs
  stylingNote?: string | null; // IA: cómo complementarlo / armar el look
  inspirationImage?: string | null; // imagen de referencia del estilo (cómo quedaría)
  images?: string[]; // galería: varias fotos del producto (urls o rutas /generated/…)
  recoIds?: string[]; // "completa el look" elegido por Gemini (ids del catálogo)
  recoNote?: string | null; // explicación elegante de la recomendación
  recoContext?: string | null; // slug de colección que ambienta la recomendación
}

export interface Collection {
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  kind: "season" | "style" | "occasion";
  heroImage: string | null;
}

export interface Catalog {
  generatedAt: string;
  exchange: {
    rate: number; // soles por dólar (venta + markup)
    sell: number;
    markup: number;
    source: string;
    fetchedAt: string;
  };
  collections: Collection[];
  products: Product[];
}
