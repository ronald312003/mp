import Link from "next/link";
import Image from "next/image";
import { getCatalog } from "@/lib/data";
import ProductCard from "@/components/ProductCard";
import TypeStrip from "@/components/TypeStrip";
import Reveal from "@/components/Reveal";
import StyleConcierge from "@/components/StyleConcierge";
import HomeHouseReel from "@/components/HomeHouseReel";
import type { Product } from "@/lib/types";

export const revalidate = 3600;

function pickFeatured(products: Product[], type: string, n: number) {
  return products.filter((product) => product.type === type).slice(0, n);
}

export default async function Home() {
  const { collections, products, exchange } = await getCatalog();
  const counts = new Map<string, number>();
  for (const product of products) {
    for (const collection of product.collections) {
      counts.set(collection, (counts.get(collection) ?? 0) + 1);
    }
  }

  const preferredBrands = [
    "Tom Ford", "Thom Browne", "Sandro", "Frescobol Carioca", "Orlebar Brown",
    "Saint Laurent", "Ferragamo", "Versace", "Seiko", "Tissot", "Citizen",
    "Creed", "Dior", "Valentino"
  ];
  const availableBrands = new Set(products.map((product) => product.brand));
  const preferred = preferredBrands.filter((brand) => availableBrands.has(brand));
  const preferredSet = new Set(preferred);
  const brands = [
    ...preferred,
    ...[...availableBrands].filter((brand) => !preferredSet.has(brand)).sort()
  ];
  const occasionOrder = ["casual", "oficina", "noche", "verano", "elegante"];
  const occasionCollections = occasionOrder
    .map((slug) => collections.find((collection) => collection.slug === slug))
    .filter((collection): collection is NonNullable<typeof collection> => Boolean(collection));

  const featured = [
    ...pickFeatured(products.filter((product) => product.gender === "men"), "clothing", 2),
    ...pickFeatured(products.filter((product) => product.gender === "men"), "shoes", 2),
    ...pickFeatured(products, "watch", 2),
    ...pickFeatured(products, "perfume", 2)
  ];

  return (
    <div>
      <section className="relative overflow-hidden border-b border-line bg-surface2 py-10 sm:py-20 lg:min-h-[720px] lg:py-24">
        <Image src="/editorial/maison-atelier.png" alt="Atelier editorial de Maison Privée" fill priority sizes="100vw" className="atelier-drift object-cover object-[64%_center] opacity-45 dark:opacity-20 sm:object-center" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-bg via-bg/90 to-bg/25" />
        <div className="container-shell relative grid items-center gap-10 lg:grid-cols-[0.92fr_1.08fr] lg:gap-16">
          <div className="min-w-0 max-w-2xl">
            <p className="eyebrow fade-up">Maison Privée · Curaduría personal</p>
            <h1 className="fade-up fade-up-2 mt-5 font-serif text-[2.65rem] leading-[0.98] text-content min-[390px]:text-5xl sm:text-7xl lg:text-[5.5rem]">
              Encontrar tu próxima pieza debería ser simple.
            </h1>
            <p className="fade-up fade-up-3 mt-6 max-w-xl text-xl leading-relaxed text-muted sm:text-2xl">
              Cuatro preguntas. Una selección hecha para ti.
            </p>
            <div className="fade-up fade-up-4 mt-8 flex flex-wrap gap-3">
              <Link href="/tienda?gender=men" className="btn-ghost">Él</Link>
              <Link href="/tienda?gender=women" className="btn-ghost">Ella</Link>
              <Link href="/casas" className="btn-ghost">Casas de moda</Link>
            </div>
          </div>
          <div className="fade-up fade-up-3 min-w-0 max-w-full">
            <StyleConcierge brands={brands} />
          </div>
        </div>
      </section>

      <section className="container-shell py-16 sm:py-24">
        <Reveal>
          <div className="mb-9 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <p className="eyebrow">Ir directamente</p>
              <h2 className="mt-3 font-serif text-4xl text-content sm:text-5xl">¿Qué estás buscando?</h2>
            </div>
            <Link href="/tienda" className="text-base font-medium text-muted hover:text-content">
              Ver todo el catálogo →
            </Link>
          </div>
        </Reveal>
        <Reveal delay={80}><TypeStrip /></Reveal>
      </section>

      <section className="border-y border-line bg-surface py-16 sm:py-24">
        <div className="container-shell">
          <Reveal>
            <p className="eyebrow">Comprar por momento</p>
            <h2 className="mt-3 font-serif text-4xl text-content sm:text-5xl">La ocasión primero</h2>
            <p className="mt-3 max-w-2xl text-lg text-muted">
              Una selección útil comienza por saber dónde y cómo la vas a usar.
            </p>
          </Reveal>
          <div className="mt-10 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-5">
            {occasionCollections.map((collection, index) => (
              <Link key={collection.slug} href={`/coleccion/${collection.slug}`} className="group flex min-h-[220px] flex-col justify-between rounded-[24px] border border-line bg-bg p-5 transition duration-500 hover:-translate-y-1 hover:border-accent hover:shadow-lift sm:min-h-[280px] sm:p-6">
                <span className="font-serif text-5xl text-accent/35">0{index + 1}</span>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.16em] text-muted sm:text-xs">{counts.get(collection.slug) || 0} piezas</p>
                  <h3 className="mt-2 font-serif text-2xl leading-none text-content sm:text-3xl">{collection.title}</h3>
                  <p className="mt-3 hidden text-sm leading-relaxed text-muted sm:block">{collection.subtitle}</p>
                  <span className="mt-4 inline-block text-sm text-accent transition-transform group-hover:translate-x-1">Explorar →</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="container-shell py-16 sm:py-24">
        <Reveal>
          <p className="eyebrow">Direcciones con historia</p>
          <div className="mt-3 mb-9 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <h2 className="font-serif text-4xl text-content sm:text-5xl">Las casas, de cerca.</h2>
            <Link href="/casas" className="text-base font-medium text-muted hover:text-content">Conocer las casas →</Link>
          </div>
        </Reveal>
        <Reveal delay={80}><HomeHouseReel /></Reveal>
      </section>

      <section className="border-t border-line bg-surface py-16 sm:py-24">
        <div className="container-shell">
        <Reveal>
          <p className="eyebrow">Selección de la casa</p>
          <h2 className="mt-3 font-serif text-4xl text-content sm:text-5xl">Piezas para empezar</h2>
        </Reveal>
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((product, index) => (
            <Reveal key={product.id} delay={(index % 4) * 70}>
              <ProductCard product={product} rate={exchange.rate} />
            </Reveal>
          ))}
        </div>
        </div>
      </section>

      <section className="container-shell pb-20">
        <div className="grid gap-5 rounded-[28px] border border-line bg-surface2 p-6 sm:grid-cols-3 sm:p-10">
          {[
            ["Producto visible", "Galerías amplias y vistas claras para decidir con seguridad."],
            ["Selección útil", "Recomendaciones coherentes con género, ocasión y categoría."],
            ["Compra sencilla", "Precios en dólares y soles, con atención directa por WhatsApp."]
          ].map(([title, description]) => (
            <div key={title} className="rounded-2xl bg-surface p-5">
              <h3 className="font-serif text-2xl text-content">{title}</h3>
              <p className="mt-2 text-base leading-relaxed text-muted">{description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
