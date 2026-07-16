import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import { getCatalog } from "@/lib/data";
import { FASHION_HOUSES } from "@/lib/fashion-houses";
import type { Product } from "@/lib/types";
import { HOUSE_IMAGES } from "@/lib/house-images";
import { HOUSE_MEDIA, brandHero, houseSlug } from "@/lib/house-media";
import FashionHouseSpotlight from "@/components/FashionHouseSpotlight";
import HouseMediaStrip from "@/components/HouseMediaStrip";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Casas de moda | Maison Privée",
  description:
    "Historia, filosofía y códigos de las casas de moda presentes en la selección de Maison Privée."
};

const TYPE_LABELS: Record<string, string> = {
  clothing: "ropa",
  shoes: "calzado",
  watch: "relojes",
  perfume: "perfumería"
};

function houseId(name: string) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function representative(products: Product[]) {
  const priority: Record<string, number> = { clothing: 0, shoes: 1, perfume: 2, watch: 3 };
  return [...products].sort(
    (a, b) =>
      (priority[a.type] ?? 9) - (priority[b.type] ?? 9) ||
      (b.images?.length || 0) - (a.images?.length || 0)
  )[0];
}

export default async function FashionHousesPage() {
  const { products } = await getCatalog();
  const houses = FASHION_HOUSES.map((house) => {
    const pieces = products.filter((product) => product.brand === house.name);
    const types = [...new Set(pieces.map((product) => TYPE_LABELS[product.type] || product.type))];
    return { ...house, pieces, types, featured: representative(pieces), visual: HOUSE_IMAGES[house.name] };
  }).filter((house) => house.pieces.length && house.featured);

  const pieceCount = houses.reduce((total, house) => total + house.pieces.length, 0);

  return (
    <div>
      <section className="relative overflow-hidden border-b border-line bg-surface2 py-16 sm:py-24">
        <div className="pointer-events-none absolute -left-28 top-0 h-80 w-80 rounded-full bg-accent/10 blur-3xl" />
        <div className="container-shell relative">
          <p className="eyebrow">Archivo Maison Privée</p>
          <div className="mt-5 grid gap-8 lg:grid-cols-[1.35fr_0.65fr] lg:items-end">
            <div>
              <h1 className="max-w-4xl font-serif text-5xl leading-[0.98] text-content sm:text-7xl">
                Conoce la historia antes de elegir la pieza.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted sm:text-xl">
                Cada casa conserva una forma particular de entender el oficio, la proporción y el lujo.
                Esta guía conecta esos códigos con las piezas disponibles hoy en nuestro catálogo.
              </p>
            </div>
            <dl className="grid grid-cols-2 gap-3 rounded-[28px] border border-line bg-surface p-5 shadow-soft">
              <div className="rounded-2xl bg-surface2 p-4">
                <dt className="text-sm text-muted">Casas seleccionadas</dt>
                <dd className="mt-1 font-serif text-4xl text-content">{houses.length}</dd>
              </div>
              <div className="rounded-2xl bg-surface2 p-4">
                <dt className="text-sm text-muted">Piezas disponibles</dt>
                <dd className="mt-1 font-serif text-4xl text-content">{pieceCount}</dd>
              </div>
            </dl>
          </div>

          <nav aria-label="Índice de casas" className="no-scrollbar mt-10 flex gap-2 overflow-x-auto pb-2">
            {houses.map((house) => (
              <a
                key={house.name}
                href={`#${houseId(house.name)}`}
                className="whitespace-nowrap rounded-full border border-line bg-surface px-4 py-2.5 text-sm font-medium text-content transition hover:border-accent"
              >
                {house.name}
              </a>
            ))}
          </nav>
        </div>
      </section>

      <FashionHouseSpotlight houses={houses.filter((house) => brandHero(house.name) || house.visual).map((house) => ({
        name: house.name,
        origin: house.origin,
        since: house.since,
        identity: house.identity,
        // Hero "luxury" scrapeado (1200px); la foto Wikimedia queda de respaldo.
        imageUrl: brandHero(house.name) || house.visual.imageUrl,
        imageAlt: house.visual?.imageAlt || `Boutique de ${house.name}`,
        anchor: houseId(house.name)
      }))} />

      <section className="container-shell pb-16 sm:pb-24">
        <div className="grid gap-6 xl:grid-cols-2">
          {houses.map((house, index) => (
            <Reveal key={house.name} delay={(index % 2) * 80}>
              <article
                id={houseId(house.name)}
                className="scroll-mt-36 overflow-hidden rounded-[28px] border border-line bg-surface shadow-soft"
              >
                <div className="grid min-h-full">
                  <div className="relative aspect-[16/10] overflow-hidden bg-surface2">
                    <Image
                      src={brandHero(house.name) || house.visual?.imageUrl || house.featured.imageUrl}
                      alt={house.visual?.imageAlt || `Boutique de ${house.name}`}
                      fill
                      unoptimized
                      sizes="(max-width: 1280px) 100vw, 50vw"
                      className={`transition-transform duration-1000 ease-out hover:scale-105 ${brandHero(house.name) || house.visual ? "object-cover" : "object-contain p-7"}`}
                    />
                    <span className="liquid-glass absolute left-4 top-4 rounded-full px-3 py-1.5 text-xs font-medium text-content">
                      {house.pieces.length} piezas
                    </span>
                  </div>

                  <div className="flex flex-col p-6 sm:p-7">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="eyebrow">{house.origin} · {house.since}</p>
                        <h2 className="mt-2 font-serif text-4xl leading-none text-content">{house.name}</h2>
                      </div>
                    </div>

                    <p className="mt-4 text-lg font-medium text-content">{house.identity}</p>
                    <p className="mt-4 text-base leading-relaxed text-muted">{house.history}</p>

                    <div className="mt-5 rounded-2xl bg-surface2 p-4">
                      <p className="text-xs uppercase tracking-luxe text-muted">Filosofía</p>
                      <p className="mt-2 text-base leading-relaxed text-content">{house.philosophy}</p>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2">
                      {house.codes.map((code) => (
                        <span key={code} className="rounded-full border border-line px-3 py-1.5 text-sm text-muted">
                          {code}
                        </span>
                      ))}
                    </div>

                    <p className="mt-5 text-sm text-muted">
                      Disponible en {house.types.join(", ")}.
                    </p>

                    <HouseMediaStrip
                      house={house.name}
                      signature={HOUSE_MEDIA[house.name]?.signature}
                      clips={HOUSE_MEDIA[house.name]?.clips ?? []}
                    />

                    <div className="mt-auto flex flex-wrap items-center gap-3 pt-6">
                      <Link href={`/casas/${houseSlug(house.name)}`} className="btn-primary">
                        Visitar la casa →
                      </Link>
                      <Link
                        href={`/tienda?brand=${encodeURIComponent(house.name)}`}
                        className="btn-ghost"
                      >
                        Ver la selección
                      </Link>
                    </div>
                  </div>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </section>
    </div>
  );
}
