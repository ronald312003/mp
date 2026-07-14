import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { getCatalog, getComplements } from "@/lib/data";
import PriceTag from "@/components/PriceTag";
import ProductCard from "@/components/ProductCard";
import ProductGallery from "@/components/ProductGallery";
import WatchShowcase3D from "@/components/WatchShowcase3D";
import Reveal from "@/components/Reveal";

export const revalidate = 3600;

const TYPE_LABEL: Record<string, string> = {
  watch: "Reloj",
  perfume: "Perfume",
  clothing: "Ropa",
  shoes: "Calzado"
};
const GENDER_LABEL: Record<string, string> = {
  men: "Hombre",
  women: "Mujer",
  unisex: "Unisex"
};

// Ambiente visual de la recomendación por contexto (degradados propios:
// siempre elegantes y nunca dependen de imágenes externas que fallen).
const CTX_STYLE: Record<string, { bg: string; tagline: string }> = {
  invierno: {
    bg: "linear-gradient(130deg, #232a33 0%, #3d4856 55%, #56637a 100%)",
    tagline: "Capas, texturas y calidez para la temporada fría"
  },
  verano: {
    bg: "linear-gradient(130deg, #b98a55 0%, #d9b98c 55%, #ecd9b8 100%)",
    tagline: "Ligereza, luz y frescura para los días de calor"
  },
  noche: {
    bg: "linear-gradient(130deg, #14100d 0%, #2b2118 55%, #4a3620 100%)",
    tagline: "Presencia y estela para las salidas que importan"
  },
  oficina: {
    bg: "linear-gradient(130deg, #3a332c 0%, #56493c 55%, #6f6152 100%)",
    tagline: "Sobriedad impecable para la jornada profesional"
  },
  elegante: {
    bg: "linear-gradient(130deg, #2e2620 0%, #574433 55%, #8a6d4b 100%)",
    tagline: "Refinado y atemporal, sin esfuerzo aparente"
  },
  casual: {
    bg: "linear-gradient(130deg, #55483c 0%, #7a6853 55%, #a08a6d 100%)",
    tagline: "El día a día, con carácter y buen gusto"
  },
  deportivo: {
    bg: "linear-gradient(130deg, #2c353c 0%, #45535d 55%, #5f7079 100%)",
    tagline: "Energía y precisión para un ritmo activo"
  },
  "lujo-silencioso": {
    bg: "linear-gradient(130deg, #211b17 0%, #40342a 55%, #6b5640 100%)",
    tagline: "Lujo que no necesita anunciarse"
  }
};

export async function generateMetadata({
  params
}: {
  params: { id: string };
}): Promise<Metadata> {
  const { products } = await getCatalog();
  const p = products.find((x) => x.id === params.id);
  return {
    title: p ? `${p.brand} — ${p.name} · Maison Privée` : "Producto · Maison Privée",
    description: p?.description ?? undefined
  };
}

export default async function ProductPage({ params }: { params: { id: string } }) {
  const { products, collections, exchange } = await getCatalog();
  const product = products.find((p) => p.id === params.id);
  if (!product) notFound();

  const productCollections = collections.filter((c) => product.collections.includes(c.slug));
  const related = products
    .filter(
      (p) =>
        p.id !== product.id &&
        (p.gender === product.gender || p.gender === "unisex" || product.gender === "unisex") &&
        p.collections.some((c) => product.collections.includes(c))
    )
    .slice(0, 4);
  const complements = await getComplements(product, 3);

  // Galería: rutas locales (/generated/…) directas; las remotas pasan por el
  // proxy /api/img para no exponer el host de origen.
  const gallerySrcs = (product.images?.length ? product.images : [product.imageUrl]).map(
    (u, i) => (u.startsWith("/") ? u : `/api/img/${product.id}?i=${i}`)
  );

  // Ambiente de la recomendación (invierno, noche, oficina…): el contexto
  // elegido por Gemini; si no hay, la primera colección del producto.
  const ctxSlug = product.recoContext ?? product.collections[0] ?? "elegante";
  const ctxCollection = collections.find((c) => c.slug === ctxSlug);
  const ctx = CTX_STYLE[ctxSlug] ?? CTX_STYLE.elegante;
  const moodTitle = ctxCollection?.title ?? "Tu estilo";

  return (
    <div className="container-shell py-8">
      <nav className="mb-6 text-xs text-muted">
        <Link href="/" className="hover:text-content">Inicio</Link>
        <span className="mx-2">/</span>
        <Link href={`/tienda?type=${product.type}`} className="hover:text-content">
          {TYPE_LABEL[product.type]}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-content">{product.brand}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        {/* Galería con efecto 3D (varias vistas reales del producto) */}
        <ProductGallery srcs={gallerySrcs} alt={`${product.brand} ${product.name}`} />

        {/* Detalle */}
        <div className="flex flex-col">
          <p className="eyebrow">{product.brand}</p>
          <h1 className="mt-2 font-serif text-3xl leading-tight text-content sm:text-4xl">
            {product.name}
          </h1>

          <div className="mt-3 flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.14em] text-muted">
            <span className="rounded-full bg-surface2 px-3 py-1">{TYPE_LABEL[product.type]}</span>
            <span className="rounded-full bg-surface2 px-3 py-1">{GENDER_LABEL[product.gender]}</span>
          </div>

          <div className="mt-6 border-y border-line py-6">
            <PriceTag usd={product.finalPriceUsd} rate={exchange.rate} size="lg" />
            <p className="mt-2 text-xs text-muted">
              Precio en dólares y soles (1 USD ≈ S/ {exchange.rate.toFixed(2)}, venta Kambista + 0.10).
            </p>
          </div>

          {product.description && (
            <p className="mt-6 text-sm leading-relaxed text-muted">{product.description}</p>
          )}

          {productCollections.length > 0 && (
            <div className="mt-8">
              <p className="eyebrow mb-3">Combina con el estilo</p>
              <div className="flex flex-wrap gap-2">
                {productCollections.map((c) => (
                  <Link
                    key={c.slug}
                    href={`/coleccion/${c.slug}`}
                    className="rounded-full border border-line px-4 py-1.5 text-[12px] uppercase tracking-[0.12em] text-content transition hover:border-accent hover:text-accent"
                  >
                    {c.title}
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8 flex flex-col gap-3">
            <button className="btn-primary w-full py-3.5">Consultar por WhatsApp</button>
            <p className="text-center text-xs text-muted">
              Envío a todo el Perú · Pago contra entrega en Lima
            </p>
          </div>
        </div>
      </div>

      {/* Experiencia 3D exclusiva para relojes: anatomía animada */}
      {product.type === "watch" && (
        <WatchShowcase3D src={gallerySrcs[0]} alt={`${product.brand} ${product.name}`} />
      )}

      {/* COMPLETA EL LOOK — selección de Gemini sobre nuestro catálogo.
          Todas las imágenes son de NUESTROS productos (fiables), para guiar
          exactamente qué escoger como complemento del outfit. */}
      {(complements.length > 0 || product.stylingNote) && (
        <Reveal as="section" className="mt-24">
          <div className="mb-8">
            <p className="eyebrow">Estilismo por IA</p>
            <div className="rule-gold mt-3" />
            <h2 className="mt-4 font-serif text-3xl text-content sm:text-4xl">Completa el look</h2>
          </div>

          <div className="overflow-hidden rounded-editorial ring-1 ring-line">
            {/* Banda de contexto: ambiente elegido por la IA (sin fotos externas) */}
            <div className="relative p-6 sm:p-8" style={{ background: ctx.bg }}>
              <div
                className="pointer-events-none absolute inset-0 opacity-40"
                style={{
                  background:
                    "radial-gradient(80% 120% at 85% 0%, rgba(255,255,255,0.18), transparent 60%)"
                }}
              />
              <span className="relative rounded-full bg-black/25 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-white backdrop-blur">
                Pensado para {moodTitle}
              </span>
              <p className="relative mt-3 text-[12px] uppercase tracking-[0.14em] text-white/75">
                {ctx.tagline}
              </p>
              {product.recoNote && (
                <p className="relative mt-3 max-w-3xl font-serif text-lg leading-snug text-white sm:text-xl">
                  “{product.recoNote}”
                </p>
              )}
            </div>

            {/* Tablero del outfit: tu pieza + los complementos del catálogo */}
            <div className="grid gap-0 bg-surface lg:grid-cols-[1fr_2.2fr]">
              <div className="flex flex-col border-b border-line p-6 lg:border-b-0 lg:border-r">
                <p className="text-[11px] uppercase tracking-luxe text-muted">Tu pieza</p>
                <div className="relative mt-3 flex-1 overflow-hidden rounded-md bg-surface2 ring-1 ring-line min-h-[220px]">
                  <Image
                    src={gallerySrcs[0]}
                    alt={`${product.brand} ${product.name}`}
                    fill
                    sizes="(max-width:1024px) 100vw, 25vw"
                    className="object-contain p-6"
                  />
                </div>
                <p className="mt-3 text-sm text-content">
                  <span className="eyebrow block">{product.brand}</span>
                  <span className="line-clamp-2">{product.name}</span>
                </p>
              </div>

              <div className="p-6 sm:p-8">
                <p className="mb-4 text-sm text-muted">
                  Añádele estas piezas de nuestro catálogo — elegidas por la IA para este{" "}
                  {TYPE_LABEL[product.type].toLowerCase()}:
                </p>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {complements.map((p) => (
                    <ProductCard key={p.id} product={p} rate={exchange.rate} />
                  ))}
                </div>

                {product.stylingNote && (
                  <div className="mt-6 border-t border-line pt-5">
                    <p className="text-[11px] uppercase tracking-luxe text-muted">Cómo llevarlo</p>
                    <p className="mt-2 text-[15px] leading-relaxed text-content">
                      {product.stylingNote}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Reveal>
      )}

      {related.length > 0 && (
        <section className="mt-24">
          <h2 className="mb-6 font-serif text-2xl text-content">También te puede gustar</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} rate={exchange.rate} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
