import Link from "next/link";
import { getCatalog } from "@/lib/data";
import ProductCard from "@/components/ProductCard";
import type { Product } from "@/lib/types";

export const revalidate = 3600;

const TYPES = [
  { key: "all", label: "Todo" },
  { key: "watch", label: "Relojes" },
  { key: "perfume", label: "Perfumes" },
  { key: "clothing", label: "Ropa" },
  { key: "shoes", label: "Zapatos" }
];
const GENDERS = [
  { key: "all", label: "Todos" },
  { key: "men", label: "Hombre" },
  { key: "women", label: "Mujer" },
  { key: "unisex", label: "Unisex" }
];
const SORTS = [
  { key: "price-asc", label: "Precio ↑" },
  { key: "price-desc", label: "Precio ↓" },
  { key: "brand", label: "Marca" }
];

function buildHref(base: Record<string, string | undefined>, patch: Record<string, string>) {
  const merged = { ...base, ...patch };
  const qs = Object.entries(merged)
    .filter(([, v]) => v && v !== "all")
    .map(([k, v]) => `${k}=${encodeURIComponent(v as string)}`)
    .join("&");
  return "/tienda" + (qs ? `?${qs}` : "");
}

export default async function ShopPage({
  searchParams
}: {
  searchParams: { type?: string; gender?: string; brand?: string; sort?: string };
}) {
  const { products, exchange } = await getCatalog();
  const type = searchParams.type ?? "all";
  const gender = searchParams.gender ?? "all";
  const brand = searchParams.brand ?? "all";
  const sort = searchParams.sort ?? "price-asc";
  const base = { type, gender, brand, sort };

  let items: Product[] = products;
  if (type !== "all") items = items.filter((p) => p.type === type);
  if (gender !== "all") items = items.filter((p) => p.gender === gender);
  if (brand !== "all") items = items.filter((p) => p.brand === brand);

  items = [...items].sort((a, b) => {
    if (sort === "price-desc") return b.finalPriceUsd - a.finalPriceUsd;
    if (sort === "brand") return a.brand.localeCompare(b.brand);
    return a.finalPriceUsd - b.finalPriceUsd;
  });

  const brandPool = type === "all" ? products : products.filter((p) => p.type === type);
  const brands = [...new Set(brandPool.map((p) => p.brand))].sort();

  return (
    <div className="container-shell py-10">
      <div className="mb-8">
        <p className="eyebrow">Catálogo</p>
        <h1 className="mt-2 font-serif text-4xl text-content">La colección completa</h1>
      </div>

      {/* Tipo */}
      <div className="no-scrollbar mb-6 flex gap-2 overflow-x-auto border-b border-line">
        {TYPES.map((t) => (
          <Link
            key={t.key}
            href={buildHref(base, { type: t.key, brand: "all" })}
            className={`-mb-px whitespace-nowrap border-b-2 px-4 py-3 text-sm transition ${
              type === t.key
                ? "border-accent text-content"
                : "border-transparent text-muted hover:text-content"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {/* Toolbar: género · marca · orden — legible y espaciado */}
      <div className="mb-8 flex flex-col gap-4 border-b border-line pb-6 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-10">
        {/* Género */}
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-[0.16em] text-muted">Género</span>
          <div className="flex gap-1">
            {GENDERS.map((g) => (
              <Link
                key={g.key}
                href={buildHref(base, { gender: g.key })}
                className={`rounded-full px-3 py-1.5 text-[13px] transition ${
                  gender === g.key ? "bg-accent text-accent-fg" : "text-muted hover:text-content"
                }`}
              >
                {g.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Marca — desplegable elegante (sin JS) */}
        <details className="group relative">
          <summary className="flex cursor-pointer list-none items-center gap-2 text-[13px] text-content marker:hidden">
            <span className="text-xs uppercase tracking-[0.16em] text-muted">Marca</span>
            <span className="font-medium">{brand === "all" ? "Todas" : brand}</span>
            <span className="text-muted transition group-open:rotate-180">▾</span>
          </summary>
          <div className="absolute left-0 top-full z-20 mt-2 max-h-72 w-64 overflow-y-auto rounded-lg border border-line bg-surface p-2 shadow-soft">
            <Link
              href={buildHref(base, { brand: "all" })}
              className={`block rounded-md px-3 py-2 text-sm transition hover:bg-surface2 ${
                brand === "all" ? "text-accent" : "text-content"
              }`}
            >
              Todas las marcas
            </Link>
            {brands.map((b) => (
              <Link
                key={b}
                href={buildHref(base, { brand: b })}
                className={`block rounded-md px-3 py-2 text-sm transition hover:bg-surface2 ${
                  brand === b ? "text-accent" : "text-content"
                }`}
              >
                {b}
              </Link>
            ))}
          </div>
        </details>

        {/* Orden */}
        <div className="flex items-center gap-2 sm:ml-auto">
          <span className="text-xs uppercase tracking-[0.16em] text-muted">Orden</span>
          <div className="flex gap-1">
            {SORTS.map((s) => (
              <Link
                key={s.key}
                href={buildHref(base, { sort: s.key })}
                className={`rounded-full px-3 py-1.5 text-[13px] transition ${
                  sort === s.key ? "bg-accent text-accent-fg" : "text-muted hover:text-content"
                }`}
              >
                {s.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <p className="mb-6 text-sm text-muted">{items.length} piezas</p>

      {items.length === 0 ? (
        <p className="py-16 text-center text-muted">No hay piezas con estos filtros.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {items.map((p) => (
            <ProductCard key={p.id} product={p} rate={exchange.rate} />
          ))}
        </div>
      )}
    </div>
  );
}
