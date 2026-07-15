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
const OCCASIONS = [
  { key: "all", label: "Cualquier ocasión" },
  { key: "casual", label: "Día a día" },
  { key: "oficina", label: "Oficina" },
  { key: "noche", label: "Noche" },
  { key: "verano", label: "Viaje" },
  { key: "elegante", label: "Regalo / elegante" }
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
  searchParams: { type?: string; gender?: string; brand?: string; occasion?: string; sort?: string };
}) {
  const { products, exchange } = await getCatalog();
  const type = searchParams.type ?? "all";
  const gender = searchParams.gender ?? "all";
  const brand = searchParams.brand ?? "all";
  const occasion = searchParams.occasion ?? "all";
  const sort = searchParams.sort ?? "price-asc";
  const base = { type, gender, brand, occasion, sort };

  let items: Product[] = products;
  if (type !== "all") items = items.filter((p) => p.type === type);
  if (gender !== "all") items = items.filter((p) => p.gender === gender);
  if (brand !== "all") items = items.filter((p) => p.brand === brand);
  if (occasion !== "all") items = items.filter((p) => p.collections.includes(occasion));

  items = [...items].sort((a, b) => {
    if (sort === "price-desc") return b.finalPriceUsd - a.finalPriceUsd;
    if (sort === "brand") return a.brand.localeCompare(b.brand);
    return a.finalPriceUsd - b.finalPriceUsd;
  });

  const brandPool = products.filter(
    (product) =>
      (type === "all" || product.type === type) &&
      (gender === "all" || product.gender === gender) &&
      (occasion === "all" || product.collections.includes(occasion))
  );
  const brands = [...new Set(brandPool.map((p) => p.brand))].sort();

  return (
    <div className="container-shell py-10 sm:py-14">
      <div className="mb-9">
        <p className="eyebrow">Catálogo</p>
        <h1 className="mt-3 font-serif text-[2.65rem] text-content sm:text-5xl">Tu selección</h1>
        <p className="mt-3 max-w-2xl text-base text-muted sm:text-lg">
          Ajusta solo lo necesario. Mostramos primero las piezas que encajan con lo que buscas.
        </p>
      </div>

      {/* Tipo */}
      <div className="no-scrollbar mb-5 flex gap-2 overflow-x-auto rounded-2xl border border-line bg-surface p-2">
        {TYPES.map((t) => (
          <Link
            key={t.key}
            href={buildHref(base, { type: t.key, brand: "all" })}
            className={`whitespace-nowrap rounded-xl px-4 py-3 text-base font-medium transition ${
              type === t.key
                ? "bg-accent text-accent-fg"
                : "text-muted hover:bg-surface2 hover:text-content"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {/* Toolbar: género · marca · orden — legible y espaciado */}
      <div className="mb-5 flex flex-col gap-5 rounded-2xl border border-line bg-surface p-4 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-10 sm:p-5">
        {/* Género */}
        <div className="no-scrollbar flex items-center gap-2 overflow-x-auto">
          <span className="sticky left-0 z-10 bg-surface pr-1 text-sm font-medium text-muted">Para</span>
          <div className="flex shrink-0 gap-1">
            {GENDERS.map((g) => (
              <Link
                key={g.key}
                href={buildHref(base, { gender: g.key })}
                className={`rounded-full px-3.5 py-2 text-sm font-medium transition ${
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
          <summary className="flex cursor-pointer list-none items-center gap-2 text-base text-content marker:hidden">
            <span className="text-sm font-medium text-muted">Marca</span>
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
        <div className="no-scrollbar flex items-center gap-2 overflow-x-auto sm:ml-auto">
          <span className="text-sm font-medium text-muted">Orden</span>
          <div className="flex shrink-0 gap-1">
            {SORTS.map((s) => (
              <Link
                key={s.key}
                href={buildHref(base, { sort: s.key })}
                className={`rounded-full px-3.5 py-2 text-sm font-medium transition ${
                  sort === s.key ? "bg-accent text-accent-fg" : "text-muted hover:text-content"
                }`}
              >
                {s.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="no-scrollbar mb-7 flex gap-2 overflow-x-auto">
        {OCCASIONS.map((item) => (
          <Link
            key={item.key}
            href={buildHref(base, { occasion: item.key })}
            className={`whitespace-nowrap rounded-full border px-4 py-2.5 text-sm font-medium transition ${
              occasion === item.key
                ? "border-accent bg-surface2 text-content"
                : "border-line bg-surface text-muted hover:border-accent hover:text-content"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </div>

      <p className="mb-6 text-base text-muted"><strong className="text-content">{items.length}</strong> piezas encontradas</p>

      {items.length === 0 ? (
        <div className="rounded-[28px] border border-line bg-surface py-16 text-center">
          <p className="text-lg text-muted">No hay piezas con esta combinación.</p>
          <Link href="/tienda" className="btn-ghost mt-5">Limpiar filtros</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {items.map((p) => (
            <ProductCard key={p.id} product={p} rate={exchange.rate} />
          ))}
        </div>
      )}
    </div>
  );
}
