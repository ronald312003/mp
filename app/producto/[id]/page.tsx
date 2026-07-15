import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getCatalog, getComplements } from "@/lib/data";
import { styleVisuals } from "@/lib/style-visuals";
import PriceTag from "@/components/PriceTag";
import ProductCard from "@/components/ProductCard";
import ProductGallery from "@/components/ProductGallery";
import WatchShowcase3D from "@/components/WatchShowcase3D";
import RecoLook, { type LookData } from "@/components/RecoLook";
import Reveal from "@/components/Reveal";
import AddToCartButton from "@/components/AddToCartButton";
import { canonicalProductImages, productImageSrc } from "@/lib/product-images";
import { getOfficialWatchMedia } from "@/lib/watch-official-media";

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
  // Galería: rutas locales (/generated/…) directas; las remotas pasan por el
  // proxy /api/img para no exponer el host de origen.
  const gallerySrcs = canonicalProductImages(product).map((_, i) => productImageSrc(product, i));
  const officialWatchMedia = product.type === "watch"
    ? getOfficialWatchMedia(product.name, product.sourceUrl || "")
    : null;

  // Looks de "Completa el look": uno por audiencia (unisex = para él y para
  // ella, cada uno con su nota, su ambiente y sus piezas coherentes).
  const audiences: ("m" | "w")[] =
    product.gender === "unisex" ? ["m", "w"] : product.gender === "women" ? ["w"] : ["m"];
  const looks: LookData[] = [];
  for (const aud of audiences) {
    const comps = await getComplements(product, 3, aud);
    const isW = aud === "w" && product.gender === "unisex";
    const note = isW ? product.recoNoteW ?? product.recoNote ?? null : product.recoNote ?? null;
    const ctxSlug =
      (isW ? product.recoContextW : product.recoContext) ?? product.collections[0] ?? "elegante";
    const ctx = CTX_STYLE[ctxSlug] ?? CTX_STYLE.elegante;
    const ctxTitle = collections.find((c) => c.slug === ctxSlug)?.title ?? "Tu estilo";
    const visuals = styleVisuals(note, products, {
      gender: aud === "w" ? "women" : "men",
      excludeIds: new Set([product.id, ...comps.map((c) => c.id)])
    });
    looks.push({
      aud,
      title: aud === "w" ? "Para ella" : "Para él",
      note,
      ctxTitle,
      ctxBg: ctx.bg,
      // DTO público: no serializa sourceId, URL del proveedor ni costo base
      // dentro del componente cliente de recomendaciones.
      products: comps.map((item) => ({
        id: item.id,
        name: item.name,
        brand: item.brand,
        type: item.type,
        finalPriceUsd: item.finalPriceUsd,
        imageUrl: item.imageUrl,
        images: item.images
      })),
      visuals
    });
  }

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
            <AddToCartButton
              product={{
                id: product.id,
                brand: product.brand,
                name: product.name,
                finalPriceUsd: product.finalPriceUsd,
                imageSrc: productImageSrc(product)
              }}
            />
            <p className="text-center text-xs text-muted">
              Envío a todo el Perú · Pago contra entrega en Lima
            </p>
          </div>
        </div>
      </div>

      {/* Experiencia 3D exclusiva para relojes: anatomía animada */}
      {product.type === "watch" && officialWatchMedia && (
        <WatchShowcase3D
          src={gallerySrcs[0]}
          alt={`${product.brand} ${product.name}`}
          media={officialWatchMedia}
        />
      )}

      {/* COMPLETA EL LOOK — selección de la IA sobre nuestro catálogo.
          Unisex = dos looks (Para él / Para ella), cada uno con su nota,
          sus piezas y visuales de lo que la nota menciona. */}
      {looks.some((l) => l.products.length > 0) && (
        <Reveal as="section" className="mt-24">
          <div className="mb-8">
            <p className="eyebrow">Estilismo por IA</p>
            <div className="rule-gold mt-3" />
            <h2 className="mt-4 font-serif text-4xl text-content sm:text-5xl">Completa el look</h2>
          </div>

          <RecoLook
            looks={looks}
            rate={exchange.rate}
            mainSrc={gallerySrcs[0]}
            mainBrand={product.brand}
            mainName={product.name}
          />
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
