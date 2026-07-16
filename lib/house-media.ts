// ============================================================
//  Media editorial por casa: piezas icónicas y clips oficiales.
//  Fuente única para la sección "Iconos" del home (HomeIconReel) y para la
//  tira de media por casa en /casas (HouseMediaStrip).
//
//  - Los videos de YouTube se incrustan con youtube-nocookie (iframe limpio).
//  - Los de TikTok con el reproductor oficial embed/v2 (también iframe).
//  - El "poster" es opcional: si existe usamos la miniatura (hotlink estable
//    de i.ytimg.com); si no, la tarjeta cae a un póster tipográfico con el
//    color de firma de la casa. Así nunca hay imágenes rotas.
//  - Cada casa incluye una búsqueda de Pinterest para descubrir más piezas.
// ============================================================

export type Platform = "youtube" | "tiktok";

export interface MediaClip {
  platform: Platform;
  id: string;
  label: string;
}

/** Portada tipográfica cuando no hay miniatura: color de firma de la casa. */
export type Accent = "rouge" | "gold" | "ink";

export interface IconicPiece {
  house: string;
  piece: string;
  signature: string;
  note: string;
  accent: Accent;
  /** Miniatura estable (i.ytimg.com) o undefined para póster tipográfico. */
  poster?: string;
  clip: MediaClip;
  pinterest: string;
}

const yt = (id: string): string => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
export const pinterest = (query: string): string =>
  `https://www.pinterest.com/search/pins/?q=${encodeURIComponent(query)}`;

/** Miniatura de la primera portada disponible, si la hay. */
export function posterFor(piece: IconicPiece): string | undefined {
  return piece.poster;
}

// ---- Piezas icónicas para el muro del home -----------------------------
export const ICONIC_PIECES: IconicPiece[] = [
  {
    house: "Christian Louboutin",
    piece: "So Kate 120",
    signature: "Suela roja lacada",
    note: "El gesto sin logotipo: una laca escarlata que firma cada paso.",
    accent: "rouge",
    poster: yt("_U6rF1s3rq8"),
    clip: { platform: "youtube", id: "_U6rF1s3rq8", label: "La suela roja en movimiento" },
    pinterest: pinterest("christian louboutin red sole so kate heels")
  },
  {
    house: "Christian Louboutin",
    piece: "Pigalle",
    signature: "Punta afilada",
    note: "La curva que convirtió un tacón en un código reconocible.",
    accent: "rouge",
    clip: { platform: "tiktok", id: "7592448069673700639", label: "Editorial · @ld_boutique" },
    pinterest: pinterest("louboutin pigalle red bottom heels editorial")
  },
  {
    house: "Saint Laurent",
    piece: "Opyum",
    signature: "Tacón-logo YSL",
    note: "El monograma se vuelve estructura: la letra sostiene el zapato.",
    accent: "gold",
    poster: yt("dkCccVuYP5w"),
    clip: { platform: "youtube", id: "dkCccVuYP5w", label: "Saint Laurent en película" },
    pinterest: pinterest("saint laurent ysl opyum heels")
  },
  {
    house: "Saint Laurent",
    piece: "Le Smoking",
    signature: "Negro Rive Gauche",
    note: "La modernidad vestida de negro, tal como la fijó la casa.",
    accent: "ink",
    clip: { platform: "tiktok", id: "7555450103306276118", label: "Lujo silencioso · YSL" },
    pinterest: pinterest("saint laurent le smoking black heels luxury")
  },
  {
    house: "Jimmy Choo",
    piece: "Saeda",
    signature: "Tira de cristal",
    note: "Sandalia joya: la luz como acabado del calzado de noche.",
    accent: "gold",
    clip: { platform: "tiktok", id: "7612690904876584214", label: "Oficial · @jimmychoo" },
    pinterest: pinterest("jimmy choo crystal sandals heels")
  },
  {
    house: "Jimmy Choo",
    piece: "Bing",
    signature: "Malla brillante",
    note: "Una tira envolvente y el destello continuo de la firma británica.",
    accent: "gold",
    clip: { platform: "tiktok", id: "7583357886332538134", label: "Oficial · @jimmychoo" },
    pinterest: pinterest("jimmy choo bing heels sparkle")
  }
];

// ---- Media por casa (para /casas) --------------------------------------
export interface HouseMedia {
  signature?: string;
  clips: MediaClip[];
  pinterest: string;
}

export const HOUSE_MEDIA: Record<string, HouseMedia> = {
  "Christian Louboutin": {
    signature: "Suela roja",
    clips: [
      { platform: "youtube", id: "_U6rF1s3rq8", label: "La suela roja en movimiento" },
      { platform: "tiktok", id: "7592448069673700639", label: "Editorial · @ld_boutique" }
    ],
    pinterest: pinterest("christian louboutin red sole heels")
  },
  "Saint Laurent": {
    signature: "Negro Rive Gauche",
    clips: [
      { platform: "youtube", id: "dkCccVuYP5w", label: "Saint Laurent en película" },
      { platform: "tiktok", id: "7555450103306276118", label: "Lujo silencioso · YSL" },
      { platform: "tiktok", id: "7626932857189059857", label: "Tacones YSL · 4K" }
    ],
    pinterest: pinterest("saint laurent ysl heels editorial")
  },
  Dior: {
    signature: "New Look",
    clips: [
      { platform: "youtube", id: "PS78866qStM", label: "Lady Dior · savoir-faire" }
    ],
    pinterest: pinterest("dior new look savoir faire editorial")
  },
  Valentino: {
    signature: "Rojo Valentino",
    clips: [],
    pinterest: pinterest("valentino red couture editorial")
  },
  Versace: {
    signature: "Barroco Medusa",
    clips: [],
    pinterest: pinterest("versace baroque medusa editorial")
  },
  Ferragamo: {
    signature: "Calzado esculpido",
    clips: [],
    pinterest: pinterest("ferragamo shoes craftsmanship editorial")
  },
  Prada: {
    signature: "Nylon y triángulo",
    clips: [],
    pinterest: pinterest("prada nylon triangle editorial")
  },
  "Maison Margiela": {
    signature: "Tabi",
    clips: [],
    pinterest: pinterest("maison margiela tabi editorial")
  },
  "Thom Browne": {
    signature: "Cuatro barras",
    clips: [],
    pinterest: pinterest("thom browne grey suit four bars editorial")
  },
  Missoni: {
    signature: "Zigzag",
    clips: [],
    pinterest: pinterest("missoni zigzag knit editorial")
  },
  Sandro: {
    signature: "París urbano",
    clips: [],
    pinterest: pinterest("sandro paris editorial")
  },
  Bally: {
    signature: "Franja Bally",
    clips: [],
    pinterest: pinterest("bally leather shoes editorial")
  },
  Dunhill: {
    signature: "Sastrería inglesa",
    clips: [],
    pinterest: pinterest("dunhill tailoring editorial")
  },
  "Ralph Lauren": {
    signature: "Polo · Ivy",
    clips: [],
    pinterest: pinterest("ralph lauren polo ivy editorial")
  }
};
