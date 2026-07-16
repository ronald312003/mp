// ============================================================
//  Media editorial por casa: clips oficiales + galería Pinterest fija.
//  - Los clips fueron VERIFICADOS por oEmbed (título/autor reales), para que
//    la etiqueta de la casa siempre coincida con lo que muestra el video.
//  - Reproductores "solo video": TikTok player/v1 (sin descripción, música ni
//    controles) y YouTube nocookie sin controles, ambos en mute+loop para
//    autoreproducirse como fondo inmersivo.
//  - La galería de imágenes viene de data/brand-gallery.json, scrapeada de
//    Pinterest (variantes i.pinimg.com/736x, hotlink estable) y horneada fija
//    con scripts/scrape-brand-gallery.mjs.
// ============================================================

import gallery from "@/data/brand-gallery.json";

export type Platform = "youtube" | "tiktok";
export type Orientation = "landscape" | "portrait";

export interface MediaClip {
  platform: Platform;
  id: string;
  /** Qué muestra el clip (verificado contra el video real). */
  label: string;
  orientation: Orientation;
}

export interface IconicPiece {
  house: string;
  piece: string;
  signature: string;
  accent: "rouge" | "gold" | "ink";
  clip: MediaClip;
}

const GALLERY = gallery as Record<string, { query: string; images: string[]; hero?: string }>;

/** Imágenes fijas (scrapeadas de Pinterest) para una marca. */
export function brandGallery(brand: string, limit = 10): string[] {
  return (GALLERY[brand]?.images || []).slice(0, limit);
}

/** Imagen hero "luxury" de la casa (boutique/campaña, 1200px) o undefined. */
export function brandHero(brand: string): string | undefined {
  return GALLERY[brand]?.hero;
}

/** Slug estable de una casa para /casas/[slug]. */
export function houseSlug(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function pinterestSearch(brand: string): string {
  const query = GALLERY[brand]?.query || `${brand} editorial`;
  return `https://www.pinterest.com/search/pins/?q=${encodeURIComponent(query)}`;
}

/** Miniatura estable de YouTube. */
export function ytPoster(id: string): string {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}

/**
 * URL de embed "solo video": sin tarjeta de perfil, descripción ni controles.
 * Autoplay SIEMPRE en mute (requisito de los navegadores) y en bucle.
 */
export function cleanEmbedUrl(clip: MediaClip, autoplay = true): string {
  if (clip.platform === "youtube") {
    const auto = autoplay ? 1 : 0;
    return (
      `https://www.youtube-nocookie.com/embed/${clip.id}` +
      `?autoplay=${auto}&mute=1&controls=0&loop=1&playlist=${clip.id}` +
      `&playsinline=1&rel=0&modestbranding=1&iv_load_policy=3&disablekb=1&fs=0`
    );
  }
  // Reproductor oficial de TikTok (player/v1): permite ocultar TODO el chrome.
  return (
    `https://www.tiktok.com/player/v1/${clip.id}` +
    `?autoplay=${autoplay ? 1 : 0}&loop=1&muted=1&controls=0&progress_bar=0` +
    `&play_button=0&volume_control=0&fullscreen_button=0&timestamp=0` +
    `&music_info=0&description=0&rel=0&native_context_menu=0&closed_caption=0`
  );
}

// ---- Piezas icónicas (muro inmersivo del home) --------------------------
// Cada clip está verificado: autor y contenido reales del video.
export const ICONIC_PIECES: IconicPiece[] = [
  {
    house: "Christian Louboutin",
    piece: "Molten Trapman",
    signature: "Suela roja lacada",
    accent: "rouge",
    clip: {
      platform: "youtube",
      id: "_U6rF1s3rq8",
      label: "Oficial · Christian Louboutin",
      orientation: "landscape"
    }
  },
  {
    house: "Christian Louboutin",
    piece: "Red Bottoms",
    signature: "Suela roja",
    accent: "rouge",
    clip: {
      platform: "tiktok",
      id: "7592448069673700639",
      label: "Editorial · LD Boutique",
      orientation: "portrait"
    }
  },
  {
    house: "Saint Laurent",
    piece: "Tribute",
    signature: "Tacón-logo YSL",
    accent: "ink",
    clip: {
      platform: "tiktok",
      id: "7555450103306276118",
      label: "Tribute Heels · YSL",
      orientation: "portrait"
    }
  },
  {
    house: "Saint Laurent",
    piece: "Tacones YSL",
    signature: "Negro Rive Gauche",
    accent: "ink",
    clip: {
      platform: "tiktok",
      id: "7626932857189059857",
      label: "Editorial · YSL heels",
      orientation: "portrait"
    }
  },
  {
    house: "Tom Ford",
    piece: "Ombré Leather",
    signature: "Perfumería privada",
    accent: "gold",
    clip: {
      platform: "youtube",
      id: "dkCccVuYP5w",
      label: "Comercial · Ombré Leather",
      orientation: "landscape"
    }
  },
  {
    house: "Tom Ford",
    piece: "Bois Pacifique",
    signature: "Signature",
    accent: "gold",
    clip: {
      platform: "youtube",
      id: "DwY0TEQuCl8",
      label: "Oficial · TOM FORD",
      orientation: "portrait"
    }
  },
  {
    house: "Jimmy Choo",
    piece: "Moza & Max Platforms",
    signature: "Noche de cristal",
    accent: "gold",
    clip: {
      platform: "tiktok",
      id: "7612690904876584214",
      label: "Oficial · @jimmychoo",
      orientation: "portrait"
    }
  },
  {
    house: "Jimmy Choo",
    piece: "Holiday Choos",
    signature: "Brillo de fiesta",
    accent: "gold",
    clip: {
      platform: "tiktok",
      id: "7583357886332538134",
      label: "Oficial · @jimmychoo",
      orientation: "portrait"
    }
  }
];

// ---- Media por casa (para /casas) ---------------------------------------
export interface HouseMedia {
  signature?: string;
  clips: MediaClip[];
}

export const HOUSE_MEDIA: Record<string, HouseMedia> = {
  "Christian Louboutin": {
    signature: "Suela roja",
    clips: [
      { platform: "youtube", id: "_U6rF1s3rq8", label: "Oficial · Christian Louboutin", orientation: "landscape" },
      { platform: "tiktok", id: "7592448069673700639", label: "Editorial · LD Boutique", orientation: "portrait" }
    ]
  },
  "Saint Laurent": {
    signature: "Negro Rive Gauche",
    clips: [
      { platform: "tiktok", id: "7555450103306276118", label: "Tribute Heels · YSL", orientation: "portrait" },
      { platform: "tiktok", id: "7626932857189059857", label: "Editorial · YSL heels", orientation: "portrait" },
      { platform: "tiktok", id: "7515083469613976840", label: "MYSELF · fragancia YSL", orientation: "portrait" }
    ]
  },
  "Tom Ford": {
    signature: "Perfumería privada",
    clips: [
      { platform: "youtube", id: "dkCccVuYP5w", label: "Comercial · Ombré Leather", orientation: "landscape" },
      { platform: "youtube", id: "DwY0TEQuCl8", label: "Bois Pacifique · oficial", orientation: "portrait" },
      { platform: "youtube", id: "FA3EMQ18blU", label: "Tom Ford Lapels", orientation: "portrait" }
    ]
  },
  "Jimmy Choo": {
    signature: "Noche de cristal",
    clips: [
      { platform: "tiktok", id: "7612690904876584214", label: "Oficial · @jimmychoo", orientation: "portrait" },
      { platform: "tiktok", id: "7583357886332538134", label: "Oficial · @jimmychoo", orientation: "portrait" }
    ]
  },
  Dior: {
    signature: "New Look",
    clips: [
      { platform: "youtube", id: "PS78866qStM", label: "Lady Dior · savoir-faire", orientation: "landscape" }
    ]
  },
  Valentino: { signature: "Rojo Valentino", clips: [] },
  Versace: { signature: "Barroco Medusa", clips: [] },
  Ferragamo: { signature: "Calzado esculpido", clips: [] },
  Prada: { signature: "Nylon y triángulo", clips: [] },
  "Maison Margiela": { signature: "Tabi", clips: [] },
  "Thom Browne": { signature: "Cuatro barras", clips: [] },
  Missoni: { signature: "Zigzag", clips: [] },
  Sandro: { signature: "París urbano", clips: [] },
  Bally: { signature: "Franja Bally", clips: [] },
  Dunhill: { signature: "Sastrería inglesa", clips: [] },
  "Ralph Lauren": { signature: "Polo · Ivy", clips: [] }
};
