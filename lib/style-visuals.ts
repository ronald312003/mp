import type { Product } from "./types";

/**
 * Visuales para la recomendación: convierte lo que DICE la nota del estilista
 * en imágenes confiables.
 *  - Prendas mencionadas ("mocasines", "camisa blanca"…) → foto REAL de una
 *    pieza equivalente de NUESTRO catálogo (enlazada al producto).
 *  - Notas olfativas ("amaderado", "cítrico"…) → imagen curada y verificada.
 */

export interface StyleVisual {
  label: string;
  src: string;
  href?: string; // si es una pieza del catálogo
}

// Imágenes de notas olfativas (curadas y verificadas). Se sirven a través del
// proxy /api/scent/<clave> para evitar bloqueos de hotlink del CDN de origen.
export const SCENT_SOURCES: Record<string, string> = {
  amaderado: "https://thumbs.dreamstime.com/z/sandalwood-wood-texture-background-dark-brown-rough-grunge-desing-209317198.jpg",
  citrico: "https://thumbs.dreamstime.com/b/enigmatic-orange-segment-moody-still-life-lowlight-capturing-essence-nighttime-citrus-slice-captivating-351236094.jpg",
  floral: "https://img.freepik.com/premium-photo/white-jasmine-flowers-dark-background-closeup-ai-generated_1139461-2005.jpg",
  vainilla: "https://images.stockcake.com/public/8/b/6/8b61e953-d482-4fa1-9db0-7e3fc91c7c50_large/vanilla-bean-pods-stockcake.jpg",
  cuero: "https://static.vecteezy.com/system/resources/previews/075/574/844/non_2x/dark-brown-natural-leather-texture-macro-photo.jpg",
  marino: "https://img.freepik.com/premium-photo/water-texture-deep-blue-ocean-surface-with-waves_248415-5389.jpg?w=996",
  especiado: "https://cdn.myportfolio.com/2cb57fe6-d67c-4ed1-87ad-784adc765454/559a1402-462a-4e54-851d-72a53b385782_rw_1200.jpg?h=5be89f6b78a4ddf2542b9ce989ba3bec",
  ambar: "https://thumbs.dreamstime.com/b/photorealistic-close-up-raw-amber-gemstone-glowing-warm-light-macro-perspective-reveals-intricate-internal-structures-379517111.jpg",
  oud: "https://img.freepik.com/premium-photo/elegant-incense-holder-with-smoke-black-background-perfect-relaxation_1064559-114864.jpg?w=996",
  tabaco: "https://img.freepik.com/premium-photo/closeup-dried-tobacco-leaves-with-rich-textures-earthy-tones-evoking-traditional-craft-tobacco-farming-processing_1323182-14247.jpg?w=2000",
  almizcle: "https://static.vecteezy.com/system/resources/previews/056/959/032/large_2x/elegant-beige-silk-fabric-draped-gracefully-on-a-smooth-surface-showcasing-delicate-textures-and-soft-reflections-in-natural-light-photo.jpg"
};

const SCENT_VISUALS: { re: RegExp; label: string; src: string }[] = [
  { re: /amaderad|madera|sándalo|sandalo|vetiver|cedro/i, label: "Amaderado", src: "/api/scent/amaderado" },
  { re: /c[ií]tric|bergamota|lim[oó]n|naranja/i, label: "Cítrico", src: "/api/scent/citrico" },
  { re: /floral|flores|jazm[ií]n|rosa\b|peon[ií]a/i, label: "Floral", src: "/api/scent/floral" },
  { re: /vainilla|gourmand|dulce/i, label: "Vainilla", src: "/api/scent/vainilla" },
  { re: /cuero\b|piel curtida/i, label: "Cuero", src: "/api/scent/cuero" },
  { re: /marin|acu[aá]tic|oce[aá]n|fresco\b|fresca\b/i, label: "Marino", src: "/api/scent/marino" },
  { re: /especiad|canela|pimienta|cardamomo/i, label: "Especiado", src: "/api/scent/especiado" },
  { re: /[aá]mbar|ambarad|c[aá]lid/i, label: "Ámbar", src: "/api/scent/ambar" },
  { re: /\boud\b|incienso/i, label: "Oud", src: "/api/scent/oud" },
  { re: /tabaco/i, label: "Tabaco", src: "/api/scent/tabaco" },
  { re: /almizcl|musk|limpio\b|limpia\b/i, label: "Almizcle", src: "/api/scent/almizcle" }
];

// Prendas mencionadas en la nota → pieza equivalente del catálogo.
const OUTFIT_RULES: { re: RegExp; label: string; match: RegExp; type?: Product["type"] }[] = [
  { re: /mocas[ií]n|loafer/i, label: "Mocasines", match: /loafer|moccasin/i, type: "shoes" },
  { re: /zapatilla|sneaker|tenis\b/i, label: "Sneakers", match: /sneaker|trainer/i, type: "shoes" },
  { re: /bota|botín|botines/i, label: "Botas", match: /boot/i, type: "shoes" },
  { re: /tac[oó]n|stiletto|sandalia|pump/i, label: "Tacones", match: /pump|heel|sandal|stiletto|mule/i, type: "shoes" },
  { re: /derby|oxford|brogue/i, label: "Zapato de vestir", match: /derby|oxford|brogue|monk/i, type: "shoes" },
  { re: /blazer|saco\b|traje/i, label: "Sastrería", match: /blazer|suit|jacket/i, type: "clothing" },
  { re: /camisa/i, label: "Camisa", match: /shirt(?!.*t-shirt)/i, type: "clothing" },
  { re: /polo\b/i, label: "Polo", match: /\bpolo\b/i, type: "clothing" },
  { re: /vestido/i, label: "Vestido", match: /dress|gown/i, type: "clothing" },
  { re: /falda/i, label: "Falda", match: /skirt/i, type: "clothing" },
  { re: /pantal[oó]n|chino/i, label: "Pantalón", match: /pant|trouser|chino/i, type: "clothing" },
  { re: /jean|denim/i, label: "Denim", match: /jean|denim/i, type: "clothing" },
  { re: /su[eé]ter|knit|punto|cardigan/i, label: "Punto", match: /sweater|knit|cardigan|jumper/i, type: "clothing" },
  { re: /abrigo|trench|parka/i, label: "Abrigo", match: /coat|trench|parka/i, type: "clothing" }
];

const genderOk = (candidate: Product, gender: "men" | "women") =>
  candidate.gender === gender || candidate.gender === "unisex";

/**
 * Devuelve hasta `max` visuales para la nota dada: primero piezas reales del
 * catálogo (compatibles con el género del look) y luego notas olfativas.
 */
export function styleVisuals(
  note: string | null | undefined,
  products: Product[],
  opts: { gender: "men" | "women"; excludeIds?: Set<string>; max?: number }
): StyleVisual[] {
  if (!note) return [];
  const { gender, excludeIds = new Set(), max = 4 } = opts;
  const out: StyleVisual[] = [];
  const seen = new Set<string>();

  for (const rule of OUTFIT_RULES) {
    if (out.length >= max) break;
    if (!rule.re.test(note) || seen.has(rule.label)) continue;
    const piece = products.find(
      (p) =>
        (!rule.type || p.type === rule.type) &&
        rule.match.test(p.name) &&
        genderOk(p, gender) &&
        !excludeIds.has(p.id)
    );
    if (piece) {
      seen.add(rule.label);
      out.push({ label: rule.label, src: `/api/img/${piece.id}`, href: `/producto/${piece.id}` });
    }
  }

  for (const scent of SCENT_VISUALS) {
    if (out.length >= max) break;
    if (!scent.re.test(note) || seen.has(scent.label)) continue;
    seen.add(scent.label);
    out.push({ label: scent.label, src: scent.src });
  }

  return out;
}
