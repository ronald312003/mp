import Link from "next/link";
import Image from "next/image";
import type { Collection } from "@/lib/types";

export default function CollectionCard({
  collection,
  count,
  large = false
}: {
  collection: Collection;
  count?: number;
  large?: boolean;
}) {
  return (
    <Link
      href={`/coleccion/${collection.slug}`}
      className={`collection-card group relative block overflow-hidden rounded-[24px] ${
        large ? "aspect-[16/9]" : "aspect-[4/5]"
      }`}
    >
      <figure className="absolute inset-0 m-0">
        {collection.heroImage && (
          <Image
            src={collection.heroImage}
            alt={collection.title}
            fill
            sizes={large ? "100vw" : "(max-width:768px) 50vw, 25vw"}
            className="object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-105"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/5" />
      </figure>

      <div className="absolute inset-0 flex flex-col justify-end p-6 text-white">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-white/75">{collection.subtitle}</p>
        <h3 className={`mt-2 font-serif ${large ? "text-4xl sm:text-5xl" : "text-3xl"} leading-tight`}>
          {collection.title}
        </h3>
        <div className="mt-2 flex items-center gap-3 opacity-90">
          {typeof count === "number" && (
            <span className="text-sm text-white/80">{count} piezas</span>
          )}
          <span className="ml-auto inline-flex translate-x-0 items-center gap-1 text-[11px] uppercase tracking-[0.16em] text-white/0 transition-all duration-300 group-hover:translate-x-0 group-hover:text-white/90">
            Explorar →
          </span>
        </div>
      </div>
    </Link>
  );
}
