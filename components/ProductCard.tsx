import Link from "next/link";
import Image from "next/image";
import type { Product } from "@/lib/types";
import PriceTag from "./PriceTag";

const TYPE_LABEL: Record<string, string> = {
  watch: "Reloj",
  perfume: "Perfume",
  clothing: "Ropa",
  shoes: "Calzado"
};

export default function ProductCard({ product, rate }: { product: Product; rate: number }) {
  return (
    <Link
      href={`/producto/${product.id}`}
      className="group flex flex-col overflow-hidden rounded-editorial bg-surface ring-1 ring-line transition duration-300 hover:-translate-y-1 hover:shadow-lift hover:ring-accent/60"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-surface2">
        <Image
          src={`/api/img/${product.id}`}
          alt={`${product.brand} ${product.name}`}
          fill
          sizes="(max-width:640px) 50vw, (max-width:1024px) 33vw, 25vw"
          className="object-contain object-center p-4 transition-transform duration-700 group-hover:scale-[1.06]"
        />
        <span className="absolute left-4 top-4 rounded-full bg-bg/90 px-3 py-1.5 text-xs font-medium text-muted backdrop-blur">
          {TYPE_LABEL[product.type] ?? product.type}
        </span>
        {/* CTA que aparece al hover */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-full bg-gradient-to-t from-black/70 to-transparent p-3 pt-8 text-center opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <span className="text-sm font-semibold text-white">Ver producto</span>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2.5 p-5">
        <p className="eyebrow">{product.brand}</p>
        <p className="line-clamp-2 min-h-[3rem] text-base font-medium leading-snug text-content">
          {product.name}
        </p>
        <div className="mt-auto pt-2">
          <PriceTag usd={product.finalPriceUsd} rate={rate} size="sm" />
        </div>
      </div>
    </Link>
  );
}
