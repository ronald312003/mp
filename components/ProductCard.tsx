import Link from "next/link";
import type { Product } from "@/lib/types";
import { productImageSrc } from "@/lib/product-images";
import PriceTag from "./PriceTag";
import SmartImage from "./SmartImage";

export type ProductCardData = Pick<
  Product,
  "id" | "name" | "brand" | "type" | "finalPriceUsd" | "imageUrl" | "images"
>;

const TYPE_LABEL: Record<string, string> = {
  watch: "Reloj",
  perfume: "Perfume",
  clothing: "Ropa",
  shoes: "Calzado"
};

export default function ProductCard({ product, rate }: { product: ProductCardData; rate: number }) {
  return (
    <Link
      href={`/producto/${product.id}`}
      className="group flex flex-col overflow-hidden rounded-editorial bg-surface ring-1 ring-line transition duration-300 hover:-translate-y-1 hover:shadow-lift hover:ring-accent/60"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-surface2">
        <SmartImage
          src={productImageSrc(product)}
          alt={`${product.brand} ${product.name}`}
          fill
          sizes="(max-width:640px) 50vw, (max-width:1024px) 33vw, 25vw"
          className="object-contain object-center p-2.5 transition-transform duration-700 group-hover:scale-[1.06] sm:p-4"
        />
        <span className="absolute left-3 top-3 rounded-full bg-bg/90 px-2.5 py-1 text-[10px] font-medium text-muted backdrop-blur sm:left-4 sm:top-4 sm:px-3 sm:py-1.5 sm:text-xs">
          {TYPE_LABEL[product.type] ?? product.type}
        </span>
        {/* CTA que aparece al hover */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-full bg-gradient-to-t from-black/70 to-transparent p-3 pt-8 text-center opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <span className="text-sm font-semibold text-white">Ver producto</span>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3.5 sm:gap-2.5 sm:p-5">
        <p className="eyebrow">{product.brand}</p>
        <p className="line-clamp-2 min-h-[2.5rem] text-sm font-medium leading-snug text-content sm:min-h-[3rem] sm:text-base">
          {product.name}
        </p>
        <div className="mt-auto pt-2">
          <PriceTag usd={product.finalPriceUsd} rate={rate} size="sm" />
        </div>
      </div>
    </Link>
  );
}
