import Link from "next/link";
import { getCatalog } from "@/lib/data";
import CollectionCard from "@/components/CollectionCard";
import ProductCard from "@/components/ProductCard";
import TypeStrip from "@/components/TypeStrip";
import Reveal from "@/components/Reveal";
import type { Product } from "@/lib/types";

export const revalidate = 3600;

function pickFeatured(products: Product[], type: string, n: number) {
  return products.filter((p) => p.type === type).slice(0, n);
}

export default async function Home() {
  const { collections, products, exchange } = await getCatalog();

  const counts = new Map<string, number>();
  for (const p of products) for (const c of p.collections) counts.set(c, (counts.get(c) ?? 0) + 1);

  const hero = collections.find((c) => c.slug === "lujo-silencioso") ?? collections[0];
  const rest = collections.filter((c) => c.slug !== hero.slug);

  const featured = [
    ...pickFeatured(products, "watch", 2),
    ...pickFeatured(products, "perfume", 2),
    ...pickFeatured(products, "clothing", 2),
    ...pickFeatured(products, "shoes", 2)
  ].slice(0, 8);

  return (
    <div>
      {/* HERO — una sola imagen elegante */}
      <section className="relative h-[92vh] min-h-[560px] w-full overflow-hidden">
        {/* Imagen editorial */}
        <div className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=2400&q=90"
            alt="Editorial Maison Privée"
            className="slow-zoom h-full w-full object-cover object-[50%_30%]"
          />
        </div>
        {/* Veladuras para legibilidad y elegancia */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/25 to-black/70" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/45 to-transparent" />

        {/* Contenido centrado vertical, alineado a la izquierda */}
        <div className="container-shell relative flex h-full flex-col justify-center">
          <div className="max-w-2xl text-white">
            <p className="fade-up text-[11px] uppercase tracking-luxe text-white/80">
              Maison Privée · Quiet Luxury · Lima
            </p>
            <div className="fade-up fade-up-2 rule-gold mt-5" />
            <h1 className="fade-up fade-up-2 mt-5 font-serif text-[13vw] leading-[0.95] sm:text-7xl lg:text-8xl">
              El lujo que<br />no necesita gritar.
            </h1>
            <p className="fade-up fade-up-3 mt-6 max-w-md text-base leading-relaxed text-white/85">
              Relojes, moda y perfumería de diseñador, seleccionados por outfit y estilo — no por
              categoría. Piezas que hablan bajo, pero se recuerdan.
            </p>
            <div className="fade-up fade-up-4 mt-9 flex flex-wrap gap-3">
              <Link
                href="/coleccion/lujo-silencioso"
                className="rounded-editorial bg-white px-7 py-3.5 text-[12px] uppercase tracking-[0.18em] text-neutral-900 transition duration-200 hover:bg-white/90 active:scale-[0.98]"
              >
                Descubrir Lujo Silencioso
              </Link>
              <Link
                href="/tienda"
                className="rounded-editorial border border-white/60 px-7 py-3.5 text-[12px] uppercase tracking-[0.18em] text-white backdrop-blur-sm transition duration-200 hover:bg-white/10 active:scale-[0.98]"
              >
                Ver catálogo
              </Link>
            </div>
          </div>
        </div>

        {/* Indicador de scroll */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/70">
          <div className="nudge flex flex-col items-center gap-1">
            <span className="text-[10px] uppercase tracking-[0.2em]">Descubrir</span>
            <span className="text-lg leading-none">↓</span>
          </div>
        </div>
      </section>

      {/* COMPRAR POR TIPO */}
      <section className="container-shell py-24">
        <Reveal>
          <div className="mb-10 text-center">
            <p className="eyebrow">Explora la casa</p>
            <div className="rule-gold mx-auto mt-3" />
            <h2 className="mt-4 font-serif text-3xl text-content sm:text-4xl">Comprar por tipo</h2>
          </div>
        </Reveal>
        <Reveal delay={100}>
          <TypeStrip />
        </Reveal>
      </section>

      {/* COLECCIONES */}
      <section className="container-shell pb-24 pt-4">
        <Reveal>
          <div className="mb-10 flex items-end justify-between">
            <div>
              <p className="eyebrow">Compra por momento</p>
              <div className="rule-gold mt-3" />
              <h2 className="mt-4 font-serif text-4xl text-content sm:text-5xl">
                Elige por outfit, no por categoría
              </h2>
            </div>
            <Link href="/tienda" className="link-underline hidden text-sm text-muted sm:block">
              Ver todo el catálogo
            </Link>
          </div>
        </Reveal>

        <div className="mb-6">
          <CollectionCard collection={hero} count={counts.get(hero.slug)} large />
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {rest.map((c) => (
            <CollectionCard key={c.slug} collection={c} count={counts.get(c.slug)} />
          ))}
        </div>
      </section>

      {/* DESTACADOS */}
      <section className="bg-surface2 py-24">
        <div className="container-shell">
          <Reveal>
            <div className="mb-10">
              <p className="eyebrow">Selección de la casa</p>
              <div className="rule-gold mt-3" />
              <h2 className="mt-4 font-serif text-4xl text-content sm:text-5xl">Piezas destacadas</h2>
            </div>
          </Reveal>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {featured.map((p, i) => (
              <Reveal key={p.id} delay={(i % 4) * 80}>
                <ProductCard product={p} rate={exchange.rate} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* VALORES */}
      <section className="container-shell py-16">
        <div className="grid gap-8 border-y border-line py-10 sm:grid-cols-3">
          {[
            { t: "Piezas auténticas", d: "Relojes y perfumes de casas de diseñador, seleccionados uno a uno." },
            { t: "Envío a todo el Perú", d: "Precios en dólares y soles ya calculados. Pago contra entrega en Lima." },
            { t: "Lujo silencioso", d: "Curaduría por outfit y estilo, no por catálogo. Elegancia sin ruido." }
          ].map((v) => (
            <div key={v.t} className="text-center">
              <div className="rule-gold mx-auto mb-4" />
              <h3 className="font-serif text-xl text-content">{v.t}</h3>
              <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-muted">{v.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FRANJA MARCAS */}
      <section className="container-shell pb-16">
        <p className="eyebrow mb-6 text-center">Marcas en la casa</p>
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4 font-serif text-xl text-muted">
          {["Xerjoff", "Creed", "Seiko", "Tissot", "Saint Laurent", "Valentino", "Dior", "Armani", "Versace", "Ferragamo", "Jimmy Choo", "Balmain"].map(
            (b) => (
              <span key={b} className="transition-colors hover:text-accent">{b}</span>
            )
          )}
        </div>
      </section>
    </div>
  );
}
