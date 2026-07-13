import { notFound } from "next/navigation";
import Link from "next/link";
import { getCatalog } from "@/lib/data";
import ProductCard from "@/components/ProductCard";
import type { Metadata } from "next";

export const revalidate = 3600;

export async function generateStaticParams() {
  const { collections } = await getCatalog();
  return collections.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const { collections } = await getCatalog();
  const c = collections.find((x) => x.slug === params.slug);
  return {
    title: c ? `${c.title} · Maison Privée` : "Colección · Maison Privée",
    description: c?.description
  };
}

const TYPES = [
  { key: "all", label: "Todo" },
  { key: "watch", label: "Relojes" },
  { key: "perfume", label: "Perfumes" },
  { key: "clothing", label: "Ropa" },
  { key: "shoes", label: "Zapatos" }
];

export default async function CollectionPage({
  params,
  searchParams
}: {
  params: { slug: string };
  searchParams: { type?: string };
}) {
  const { collections, products, exchange } = await getCatalog();
  const collection = collections.find((c) => c.slug === params.slug);
  if (!collection) notFound();

  const type = searchParams.type ?? "all";
  let items = products.filter((p) => p.collections.includes(collection.slug));
  if (type !== "all") items = items.filter((p) => p.type === type);

  return (
    <div>
      {/* Hero de colección */}
      <section
        className="relative flex min-h-[42vh] items-end bg-cover bg-center"
        style={{
          backgroundImage: `linear-gradient(180deg, rgba(20,16,12,0.25), rgba(20,16,12,0.72)), url(${collection.heroImage})`
        }}
      >
        <div className="container-shell pb-10 text-white">
          <p className="text-[11px] uppercase tracking-luxe text-white/80">{collection.subtitle}</p>
          <h1 className="mt-2 font-serif text-5xl">{collection.title}</h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/85">
            {collection.description}
          </p>
        </div>
      </section>

      <section className="container-shell py-10">
        {/* Filtro por tipo */}
        <div className="no-scrollbar mb-8 flex gap-3 overflow-x-auto border-b border-line pb-3">
          {TYPES.map((t) => {
            const active = type === t.key;
            const href =
              t.key === "all"
                ? `/coleccion/${collection.slug}`
                : `/coleccion/${collection.slug}?type=${t.key}`;
            return (
              <Link
                key={t.key}
                href={href}
                className={`whitespace-nowrap rounded-full px-4 py-1.5 text-[12px] uppercase tracking-[0.14em] transition ${
                  active ? "bg-inverse text-inverse-fg" : "text-muted hover:bg-surface2"
                }`}
              >
                {t.label}
              </Link>
            );
          })}
        </div>

        <p className="mb-6 text-sm text-muted">{items.length} piezas</p>

        {items.length === 0 ? (
          <p className="py-16 text-center text-muted">
            No hay piezas de este tipo en esta colección.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {items.map((p) => (
              <ProductCard key={p.id} product={p} rate={exchange.rate} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
