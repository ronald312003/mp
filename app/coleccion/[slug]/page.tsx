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
  searchParams: { type?: string; brand?: string };
}) {
  const { collections, products, exchange } = await getCatalog();
  const collection = collections.find((c) => c.slug === params.slug);
  if (!collection) notFound();

  const type = searchParams.type ?? "all";
  const brand = searchParams.brand ?? "all";
  const inCollection = products.filter((p) => p.collections.includes(collection.slug));
  let items = inCollection;
  if (type !== "all") items = items.filter((p) => p.type === type);
  // Marcas disponibles según el tipo elegido (para no ofrecer combinaciones vacías).
  const brands = [...new Set(items.map((p) => p.brand))].sort();
  if (brand !== "all") items = items.filter((p) => p.brand === brand);

  const href = (patch: { type?: string; brand?: string }) => {
    const next = { type, brand, ...patch };
    const qs = Object.entries(next)
      .filter(([, value]) => value && value !== "all")
      .map(([key, value]) => `${key}=${encodeURIComponent(value as string)}`)
      .join("&");
    return `/coleccion/${collection.slug}${qs ? `?${qs}` : ""}`;
  };

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
        {/* Filtros: tipo + marca (la ocasión ya la define la colección) */}
        <div className="mb-8 flex flex-wrap items-center gap-3 border-b border-line pb-4">
          <div className="no-scrollbar flex gap-2 overflow-x-auto">
            {TYPES.map((t) => {
              const active = type === t.key;
              return (
                <Link
                  key={t.key}
                  href={href({ type: t.key, brand: "all" })}
                  className={`whitespace-nowrap rounded-full px-4 py-1.5 text-[12px] uppercase tracking-[0.14em] transition ${
                    active ? "bg-inverse text-inverse-fg" : "text-muted hover:bg-surface2"
                  }`}
                >
                  {t.label}
                </Link>
              );
            })}
          </div>

          <details className="group relative ml-auto">
            <summary className="flex cursor-pointer list-none items-center gap-2 text-sm text-content marker:hidden">
              <span className="font-medium text-muted">Marca</span>
              <span className="font-semibold">{brand === "all" ? "Todas" : brand}</span>
              <span className="text-muted transition-transform duration-200 ease-out group-open:rotate-180">▾</span>
            </summary>
            <div className="liquid-glass absolute right-0 top-full z-20 mt-2 max-h-72 w-64 overflow-y-auto rounded-2xl p-2">
              <Link
                href={href({ brand: "all" })}
                className={`block rounded-xl px-3 py-2 text-sm transition-colors duration-150 hover:bg-surface2 ${
                  brand === "all" ? "font-semibold text-accent" : "text-content"
                }`}
              >
                Todas las marcas
              </Link>
              {brands.map((b) => (
                <Link
                  key={b}
                  href={href({ brand: b })}
                  className={`block rounded-xl px-3 py-2 text-sm transition-colors duration-150 hover:bg-surface2 ${
                    brand === b ? "font-semibold text-accent" : "text-content"
                  }`}
                >
                  {b}
                </Link>
              ))}
            </div>
          </details>
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
