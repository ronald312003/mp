import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { getCatalog, getComplements } from "@/lib/data";
import PriceTag from "@/components/PriceTag";
import ProductCard from "@/components/ProductCard";
import ProductGallery from "@/components/ProductGallery";
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
    .filter((p) => p.id !== product.id && p.collections.some((c) => product.collections.includes(c)))
    .slice(0, 4);
  const complements = await getComplements(product, 3);

  // Galería: rutas locales (/generated/…) directas; las remotas pasan por el
  // proxy /api/img para no exponer el host de origen.
  const gallerySrcs = (product.images?.length ? product.images : [product.imageUrl]).map(
    (u, i) => (u.startsWith("/") ? u : `/api/img/${product.id}?i=${i}`)
  );

  // Ambiente de la recomendación (invierno, noche, oficina…): la colección
  // elegida por Gemini; si no hay, la imagen de inspiración del producto.
  const ctxCollection = collections.find((c) => c.slug === product.recoContext);
  const moodImage = ctxCollection?.heroImage ?? product.inspirationImage ?? null;
  const moodTitle = ctxCollection?.title ?? "Inspiración";

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

      {/* COMPLETA EL LOOK — selección de Gemini sobre nuestro catálogo */}
      {(complements.length > 0 || product.stylingNote) && (
        <Reveal as="section" className="mt-24">
          <div className="mb-8">
            <p className="eyebrow">Estilismo por IA</p>
            <div className="rule-gold mt-3" />
            <h2 className="mt-4 font-serif text-3xl text-content sm:text-4xl">Completa el look</h2>
          </div>

          <div className="overflow-hidden rounded-editorial ring-1 ring-line">
            {/* Ambiente de la recomendación (invierno, noche, oficina…) */}
            {moodImage && (
              <div className="relative h-56 sm:h-72">
                <Image
                  src={moodImage}
                  alt={`Ambiente: ${moodTitle}`}
                  fill
                  sizes="100vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
                  <span className="rounded-full bg-white/15 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-white backdrop-blur">
                    Pensado para {moodTitle}
                  </span>
                  {product.recoNote && (
                    <p className="mt-3 max-w-3xl font-serif text-lg leading-snug text-white sm:text-xl">
                      “{product.recoNote}”
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="bg-surface p-6 sm:p-8">
              {!moodImage && product.recoNote && (
                <p className="mb-6 max-w-3xl font-serif text-lg leading-snug text-content">
                  “{product.recoNote}”
                </p>
              )}
              <p className="mb-4 text-sm text-muted">
                Piezas de nuestro catálogo elegidas para acompañar este {product.brand}:
              </p>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {complements.map((p) => (
                  <ProductCard key={p.id} product={p} rate={exchange.rate} />
                ))}
              </div>

              {product.stylingNote && (
                <div className="mt-6 border-t border-line pt-5">
                  <p className="text-[11px] uppercase tracking-luxe text-muted">Cómo llevarlo</p>
                  <p className="mt-2 text-[15px] leading-relaxed text-content">{product.stylingNote}</p>
                </div>
              )}
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
