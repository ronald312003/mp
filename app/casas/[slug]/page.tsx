import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import Reveal from "@/components/Reveal";
import ProductCard from "@/components/ProductCard";
import VideoFrame from "@/components/VideoFrame";
import { getCatalog } from "@/lib/data";
import { FASHION_HOUSES } from "@/lib/fashion-houses";
import { HOUSE_IMAGES } from "@/lib/house-images";
import {
  HOUSE_MEDIA,
  brandGallery,
  brandHero,
  houseSlug,
  pinterestSearch
} from "@/lib/house-media";

export const revalidate = 3600;

export function generateStaticParams() {
  return FASHION_HOUSES.map((house) => ({ slug: houseSlug(house.name) }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const house = FASHION_HOUSES.find((entry) => houseSlug(entry.name) === params.slug);
  return {
    title: house ? `${house.name} · Casas | Maison Privée` : "Casa | Maison Privée",
    description: house?.identity
  };
}

/**
 * Página inmersiva de una casa: hero luxury a pantalla completa, historia y
 * filosofía, sus clips en autoplay, galería del archivo visual (Pinterest,
 * fija) y las piezas disponibles en el catálogo.
 */
export default async function HousePage({ params }: { params: { slug: string } }) {
  const house = FASHION_HOUSES.find((entry) => houseSlug(entry.name) === params.slug);
  if (!house) notFound();

  const { products, exchange } = await getCatalog();
  const pieces = products.filter((product) => product.brand === house.name);
  const hero = brandHero(house.name) || HOUSE_IMAGES[house.name]?.imageUrl;
  const media = HOUSE_MEDIA[house.name];
  const gallery = brandGallery(house.name, 9);

  return (
    <div>
      {/* Hero inmersivo */}
      <section className="relative flex min-h-[62vh] items-end overflow-hidden bg-[#141110] text-white sm:min-h-[72vh]">
        {hero && (
          <Image
            src={hero}
            alt={`Universo de ${house.name}`}
            fill
            priority
            unoptimized
            sizes="100vw"
            className="slow-zoom object-cover opacity-70"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/20" />
        <div className="container-shell relative z-10 pb-12 pt-32 sm:pb-16">
          <p className="fade-up text-xs uppercase tracking-[0.28em] text-white/70">
            {house.origin} · Desde {house.since}
          </p>
          <h1 className="fade-up fade-up-2 mt-4 max-w-4xl font-serif text-5xl leading-[0.96] sm:text-8xl">
            {house.name}
          </h1>
          <p className="fade-up fade-up-3 mt-5 max-w-xl font-serif text-2xl italic text-white/85 sm:text-3xl">
            {house.identity}
          </p>
          <div className="fade-up fade-up-4 mt-8 flex flex-wrap gap-2">
            {house.codes.map((code) => (
              <span key={code} className="liquid-glass rounded-full px-4 py-2 text-sm font-medium text-content">
                {code}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Historia + filosofía */}
      <section className="container-shell grid gap-10 py-14 sm:py-20 lg:grid-cols-[1.1fr_0.9fr]">
        <Reveal>
          <p className="eyebrow">La historia</p>
          <p className="mt-4 font-serif text-2xl leading-snug text-content sm:text-3xl">{house.history}</p>
          <a
            href={house.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="link-underline mt-6 inline-block text-sm font-medium text-muted hover:text-content"
          >
            Archivo oficial de {house.name} ↗
          </a>
        </Reveal>
        <Reveal delay={90}>
          <div className="rounded-[26px] border border-line bg-surface2 p-7 sm:p-9">
            <p className="text-xs uppercase tracking-luxe text-muted">Filosofía</p>
            <p className="mt-4 text-lg leading-relaxed text-content">{house.philosophy}</p>
          </div>
        </Reveal>
      </section>

      {/* Los clips, ya en movimiento */}
      {media?.clips?.length ? (
        <section className="bg-[#141110] py-14 text-white sm:py-20">
          <div className="container-shell">
            <Reveal>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/50">
                {house.name} en movimiento{media.signature ? ` · ${media.signature}` : ""}
              </p>
            </Reveal>
            <Reveal delay={80}>
              <div className="no-scrollbar mt-6 flex snap-x gap-4 overflow-x-auto pb-2">
                {media.clips.map((clip, index) => (
                  <figure
                    key={clip.id}
                    className={`relative shrink-0 snap-center ${
                      clip.orientation === "portrait" ? "w-[236px] sm:w-[260px]" : "w-[86vw] max-w-[540px] self-center"
                    }`}
                  >
                    <VideoFrame clip={clip} eager={index === 0} />
                    <figcaption className="liquid-glass pointer-events-none absolute bottom-3 left-3 rounded-full px-3.5 py-1.5 text-[11px] font-medium text-content">
                      {clip.label}
                    </figcaption>
                  </figure>
                ))}
              </div>
            </Reveal>
          </div>
        </section>
      ) : null}

      {/* Archivo visual (galería fija de Pinterest) */}
      {gallery.length > 0 && (
        <section className="container-shell py-14 sm:py-20">
          <Reveal>
            <div className="mb-7 flex items-end justify-between gap-4">
              <div>
                <p className="eyebrow">El archivo visual</p>
                <h2 className="mt-2 font-serif text-3xl text-content sm:text-4xl">
                  {house.name}, en imágenes.
                </h2>
              </div>
              <a
                href={pinterestSearch(house.name)}
                target="_blank"
                rel="noreferrer"
                className="whitespace-nowrap text-sm font-medium text-muted transition-colors duration-200 hover:text-content"
              >
                Más en Pinterest ↗
              </a>
            </div>
          </Reveal>
          <Reveal delay={80}>
            <div className="columns-2 gap-4 sm:columns-3 [&>figure]:mb-4">
              {gallery.map((src) => (
                <figure key={src} className="group relative break-inside-avoid overflow-hidden rounded-[18px] bg-surface2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={src}
                    alt={`${house.name} — archivo visual`}
                    loading="lazy"
                    className="w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]"
                  />
                </figure>
              ))}
            </div>
          </Reveal>
        </section>
      )}

      {/* Piezas disponibles */}
      <section className="border-t border-line bg-surface py-14 sm:py-20">
        <div className="container-shell">
          <Reveal>
            <div className="mb-8 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
              <div>
                <p className="eyebrow">En Maison Privée</p>
                <h2 className="mt-2 font-serif text-3xl text-content sm:text-4xl">
                  {pieces.length > 0
                    ? `${pieces.length} piezas de ${house.name} disponibles.`
                    : `Piezas de ${house.name}, próximamente.`}
                </h2>
              </div>
              {pieces.length > 0 && (
                <Link href={`/tienda?brand=${encodeURIComponent(house.name)}`} className="btn-accent">
                  Ver toda la selección
                </Link>
              )}
            </div>
          </Reveal>
          {pieces.length > 0 && (
            <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
              {pieces.slice(0, 8).map((product, index) => (
                <Reveal key={product.id} delay={(index % 4) * 60}>
                  <ProductCard product={product} rate={exchange.rate} />
                </Reveal>
              ))}
            </div>
          )}
          <Reveal delay={120}>
            <Link href="/casas" className="link-underline mt-10 inline-block text-sm font-medium text-muted hover:text-content">
              ← Todas las casas
            </Link>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
