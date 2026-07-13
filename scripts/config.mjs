// ============================================================
//  Configuración de scraping y de colecciones (outfits/estilos)
// ============================================================

// --- Jomashop: categorías de RELOJES (id de categoría GraphQL) ---
// Cada categoría de marca contiene TODO su catálogo de relojes.
// perBrand controla cuántos traer por marca (el catálogo real es enorme:
// Citizen ~3400, Tissot ~440, Seiko ~290, Casio ~58).
export const WATCH_CATEGORIES = [
  { brand: "Seiko", categoryId: "1452", perBrand: 90 },
  { brand: "Citizen", categoryId: "1039", perBrand: 90 },
  { brand: "Tissot", categoryId: "1510", perBrand: 90 },
  { brand: "Casio", categoryId: "1020", perBrand: 58 } // Casio (incluye G-Shock / Edifice)
];
// Cuántas páginas escanear por marca de reloj antes de recortar (para alcanzar
// modelos icónicos que están más abajo, p. ej. Citizen Tsuyosa ~pos 158).
export const WATCH_SCAN_PAGES = 4;

// Modelos/líneas icónicas de relojes: se priorizan para que SIEMPRE aparezcan.
export const HERO_WATCHES = [
  // Citizen
  "tsuyosa", "promaster", "eco-drive", "series 8", "tsukiyomi",
  // Seiko
  "prospex", "presage", "5 sports", "seiko 5", "samurai", "turtle", "alpinist", "cocktail", "king seiko",
  // Tissot
  "prx", "seastar", "le locle", "gentleman", "chrono xl", "supersport", "chemin des tourelles",
  // Casio
  "g-shock", "edifice", "oceanus", "pro trek", "ga-2100", "gshock", "casioak"
];

// --- Jomashop: PERFUMES ---
// Se usa el filtro GraphQL `manufacturer:{eq:...}` + categoría Fragrances (5869),
// que devuelve EXACTAMENTE las fragancias de cada marca (preciso y rápido).
export const FRAGRANCE_CATEGORY_ID = "5869";
export const PERFUME_PER_BRAND = 16;

// Solo perfumes con tamaño MAYOR a 2 oz (frascos completos, no testers/mini).
export const MIN_PERFUME_OZ = 2;

// Fragancias icónicas / más buscadas: se priorizan al inicio de cada marca
// para que siempre aparezcan (p. ej. Erba Pura de Xerjoff).
export const HERO_FRAGRANCES = [
  "erba pura", "aventus", "sauvage", "acqua di gio", "acqua di gioia", "stronger with you",
  "the one", "light blue", "eros", "dylan blue", "myslf", "y eau", "la nuit de l",
  "black opium", "libre", "good girl", "212", "bad boy", "invictus", "1 million", "phantom",
  "fame", "olympea", "born in roma", "voce viva", "spicebomb", "wanted", "boss bottled",
  "dior homme", "homme intense", "fahrenheit", "j'adore", "jadore", "miss dior", "oud",
  "layton", "pegasus", "delina", "herod", "greenley", "megamare", "soprano", "accento",
  "naxos", "gentleman", "l'interdit", "guilty", "bloom", "uomo", "scandal", "explorer"
];

// Marcas de perfume: nombres EXACTOS del atributo `manufacturer` de Jomashop.
// Lista definida por el usuario (21 marcas).
export const PERFUME_BRANDS = [
  "Azzaro", "Creed", "Dior", "Dolce & Gabbana", "Giorgio Armani",
  "Givenchy", "Gucci", "Hugo Boss", "Jean Paul Gaultier", "Maison Margiela",
  "Moschino", "Paco Rabanne", "Prada", "Tom Ford", "Valentino",
  "Versace", "Xerjoff", "Yves Saint Laurent"
];

// --- TheOutnet: ropa y zapatos REALES desde los sitemaps ---
export const OUTNET_SITEMAPS_CLOTHING = [
  "sitemap_en-us_clothing_1.xml", "sitemap_en-us_clothing_2.xml",
  "sitemap_en-us_clothing_3.xml", "sitemap_en-us_clothing_4.xml",
  "sitemap_en-us_clothing_5.xml"
];
export const OUTNET_SITEMAPS_SHOES = ["sitemap_en-us_shoes_1.xml"];

// Marcas permitidas (slug en la URL -> nombre a mostrar). Se aceptan variantes.
export const OUTNET_BRANDS = [
  { match: ["saint-laurent"], name: "Saint Laurent" },
  { match: ["jimmy-choo"], name: "Jimmy Choo" },
  { match: ["valentino", "valentino-garavani"], name: "Valentino" },
  { match: ["dolce-gabbana", "dolce-&-gabbana", "dolce-and-gabbana"], name: "Dolce & Gabbana" },
  { match: ["versace", "versace-jeans-couture"], name: "Versace" },
  { match: ["ralph-lauren", "polo-ralph-lauren", "lauren-ralph-lauren"], name: "Ralph Lauren" },
  { match: ["ferragamo", "salvatore-ferragamo"], name: "Ferragamo" },
  { match: ["alexander-mcqueen", "mcq-alexander-mcqueen"], name: "Alexander McQueen" },
  { match: ["maison-margiela", "mm6-maison-margiela"], name: "Maison Margiela" },
  { match: ["balmain"], name: "Balmain" }
];
export const OUTNET_PER_BRAND = 30;

// --- Colecciones de la tienda: NO categorías, sino outfits/estilos/temporadas ---
export const COLLECTIONS = [
  {
    slug: "lujo-silencioso",
    title: "Lujo Silencioso",
    subtitle: "Quiet Luxury",
    kind: "style",
    sort: 1,
    description:
      "Piezas sin logos gritones. Sastrería depurada, relojes sobrios y fragancias de firma para quien entiende que la elegancia no necesita anunciarse.",
    heroImage:
      "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=1600&q=80"
  },
  {
    slug: "elegante",
    title: "Elegante",
    subtitle: "Refinado & atemporal",
    kind: "style",
    sort: 2,
    description:
      "El vestuario de las grandes ocasiones: cortes impecables, cuero pulido y perfumes envolventes.",
    heroImage:
      "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1600&q=80"
  },
  {
    slug: "casual",
    title: "Casual",
    subtitle: "Día a día con carácter",
    kind: "style",
    sort: 3,
    description:
      "Sneakers de diseñador, relojes deportivos y aromas frescos para todos los días sin perder estilo.",
    heroImage:
      "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&w=1600&q=80"
  },
  {
    slug: "oficina",
    title: "Oficina",
    subtitle: "Business & poder",
    kind: "occasion",
    sort: 4,
    description:
      "Blazers, mocasines y relojes clásicos. Para reuniones donde la primera impresión lo es todo.",
    heroImage:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=1600&q=80"
  },
  {
    slug: "noche",
    title: "Noche",
    subtitle: "Evening & gala",
    kind: "occasion",
    sort: 5,
    description:
      "Vestidos de fiesta, tacones y fragancias intensas que dejan estela.",
    heroImage:
      "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=1600&q=80"
  },
  {
    slug: "verano",
    title: "Verano",
    subtitle: "Summer",
    kind: "season",
    sort: 6,
    description:
      "Lino, tonos claros, sneakers ligeros y perfumes cítricos y acuáticos para el calor.",
    heroImage:
      "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=1600&q=80"
  },
  {
    slug: "invierno",
    title: "Invierno",
    subtitle: "Winter",
    kind: "season",
    sort: 7,
    description:
      "Abrigos, punto, cuero y aromas cálidos, amaderados y especiados para las temporadas frías.",
    heroImage:
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1600&q=80"
  },
  {
    slug: "deportivo",
    title: "Deportivo",
    subtitle: "Sport & activo",
    kind: "style",
    sort: 8,
    description:
      "Cronógrafos, G-Shock, sneakers y colonias enérgicas para un ritmo de vida activo.",
    heroImage:
      "https://images.unsplash.com/photo-1461141346587-763ab02bced9?auto=format&fit=crop&w=1600&q=80"
  }
];

// Palabras clave para clasificar productos en colecciones.
const KW = {
  sport: /chrono|chronograph|motorsport|g-?shock|edifice|diver|solar|racing|sport|tachy/i,
  dress: /classic|dress|presage|automatic|heritage|le locle|prc|couturier|elegant|slim|thin|carson|chemin/i,
  fresh: /aqua|acqua|bleu|blue|light|sport|citrus|marine|homme sport|neroli|fresh|energy|summer|cool/i,
  intense: /intense|noir|oud|nuit|elixir|extreme|absolu|parfum intense|dark|night|black|scandal|opium|tobacco|leather/i,
  evening: /gown|evening|cocktail|sequin|satin|silk|velvet|embellish|crystal|lace|maxi dress|mini dress/i,
  tailoring: /blazer|suit|tailored|trouser|wool|pant|jacket|coat|shirt|knit|cardigan|loafer|derby|oxford|brogue/i,
  winter: /wool|cashmere|coat|knit|leather jacket|boot|puffer|padded|cardigan/i,
  summer: /linen|cotton|sandal|espadrille|short|sundress|light|poplin|crochet/i,
  sneaker: /sneaker|trainer|veja|golden goose|running|court/i,
  heel: /heel|pump|stiletto|sandal|slingback/i
};

/**
 * Asigna 1..3 colecciones (slugs) a un producto según tipo/marca/nombre.
 * @param {{type:string, brand:string, name:string, gender?:string, basePriceUsd?:number}} p
 * @returns {string[]}
 */
export function assignCollections(p) {
  const n = `${p.brand} ${p.name}`;
  const set = new Set();

  if (p.type === "watch") {
    if (KW.sport.test(n) || p.brand === "Casio") {
      set.add("deportivo");
      set.add("casual");
    }
    if (KW.dress.test(n) || p.brand === "Tissot") {
      set.add("elegante");
      set.add("oficina");
    }
    if ((p.basePriceUsd ?? 0) >= 250) set.add("lujo-silencioso");
    if (set.size === 0) {
      set.add("casual");
      set.add("elegante");
    }
  } else if (p.type === "perfume") {
    if (KW.fresh.test(n)) {
      set.add("verano");
      set.add("casual");
    }
    if (KW.intense.test(n)) {
      set.add("noche");
      set.add("invierno");
    }
    // marcas de firma -> elegante / lujo silencioso
    if (/creed|chanel|dior|yves saint laurent|valentino|prada|armani/i.test(p.brand)) {
      set.add("elegante");
    }
    if (/creed/i.test(p.brand)) set.add("lujo-silencioso");
    if (set.size === 0) {
      set.add("elegante");
      set.add("casual");
    }
  } else if (p.type === "clothing") {
    if (KW.evening.test(n)) {
      set.add("noche");
      set.add("elegante");
    }
    if (KW.tailoring.test(n)) {
      set.add("oficina");
      set.add("elegante");
    }
    if (KW.winter.test(n)) set.add("invierno");
    if (KW.summer.test(n)) set.add("verano");
    set.add("lujo-silencioso");
    if (set.size === 0) set.add("casual");
  } else if (p.type === "shoes") {
    if (KW.sneaker.test(n) || /veja|golden goose/i.test(p.brand)) {
      set.add("casual");
      set.add("deportivo");
    }
    if (KW.heel.test(n)) {
      set.add("noche");
      set.add("elegante");
    }
    if (/loafer|derby|oxford|brogue|mocc/i.test(n)) {
      set.add("oficina");
      set.add("lujo-silencioso");
    }
    if (set.size === 0) {
      set.add("casual");
      set.add("elegante");
    }
  }

  return [...set].slice(0, 3);
}
