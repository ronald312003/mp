import type { Product } from "./types";

/**
 * Mantiene una sola imagen canónica entre tarjetas, detalle y miniaturas.
 * La versión opaca invalida el CDN cuando cambia la foto sin revelar su URL.
 */
export function canonicalProductImages(product: Pick<Product, "imageUrl" | "images">) {
  return [...new Set([product.imageUrl, ...(product.images || [])].filter(Boolean))];
}

function opaqueVersion(value: string) {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

export function productImageSrc(
  product: Pick<Product, "id" | "imageUrl" | "images">,
  index = 0
) {
  const images = canonicalProductImages(product);
  const source = images[index] || images[0] || "";
  if (!source || source.startsWith("/")) return source;
  return `/api/img/${product.id}?i=${index}&v=${opaqueVersion(source)}`;
}
