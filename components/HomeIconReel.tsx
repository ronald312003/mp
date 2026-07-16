"use client";

import { ICONIC_PIECES, brandGallery, pinterestSearch } from "@/lib/house-media";
import VideoFrame from "./VideoFrame";

/**
 * Pared inmersiva de piezas icónicas en el home. Sin clics:
 * — Tira de cine horizontal donde TODOS los clips (verificados por casa) se
 *   autoreproducen en bucle y sin chrome (solo el video).
 * — Muro masonry con imágenes reales scrapeadas de Pinterest (fijas en
 *   data/brand-gallery.json), con chip de la casa en liquid glass.
 */

const REEL_ACCENT: Record<string, string> = {
  rouge: "text-[#ff5a5a]",
  gold: "text-accent",
  ink: "text-white/80"
};

/** Muro: intercala imágenes de las casas icónicas (Pinterest, fijas). */
const WALL: { house: string; src: string }[] = [
  "Christian Louboutin",
  "Saint Laurent",
  "Tom Ford",
  "Jimmy Choo"
].flatMap((house) =>
  brandGallery(house, 3).map((src) => ({ house, src }))
);

export default function HomeIconReel() {
  return (
    <div>
      {/* ---- Tira de cine: todo reproduciéndose ---- */}
      <div className="relative">
        <div className="no-scrollbar flex snap-x gap-4 overflow-x-auto pb-3">
          {ICONIC_PIECES.map((piece) => {
            const portrait = piece.clip.orientation === "portrait";
            return (
              <figure
                key={piece.clip.id}
                className={`group relative shrink-0 snap-center ${
                  portrait
                    ? "w-[236px] sm:w-[262px]"
                    : "w-[86vw] max-w-[560px] sm:w-[560px] self-center"
                }`}
              >
                <VideoFrame clip={piece.clip} />
                {/* Chip de casa en liquid glass, sobre el video */}
                <figcaption className="liquid-glass pointer-events-none absolute bottom-3 left-3 right-3 rounded-2xl px-4 py-2.5">
                  <p className={`text-[9px] font-semibold uppercase tracking-[0.2em] ${REEL_ACCENT[piece.accent]}`}>
                    {piece.signature}
                  </p>
                  <p className="mt-0.5 truncate text-sm font-semibold text-content">
                    {piece.house} · {piece.piece}
                  </p>
                </figcaption>
              </figure>
            );
          })}
        </div>
        {/* Fundido cinematográfico en los bordes del reel (solo desktop) */}
        <div className="pointer-events-none absolute inset-y-0 left-0 hidden w-14 bg-gradient-to-r from-[#141110] to-transparent lg:block" />
        <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-14 bg-gradient-to-l from-[#141110] to-transparent lg:block" />
      </div>

      {/* ---- Muro de imágenes (Pinterest, fijas en data/) ---- */}
      <div className="mt-10">
        <div className="mb-5 flex items-end justify-between gap-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/45">
            El archivo visual
          </p>
          <a
            href={pinterestSearch("Christian Louboutin")}
            target="_blank"
            rel="noreferrer"
            className="text-xs font-medium text-white/55 transition-colors duration-200 hover:text-white"
          >
            Seguir explorando en Pinterest ↗
          </a>
        </div>
        <div className="columns-2 gap-4 sm:columns-3 lg:columns-4 [&>figure]:mb-4">
          {WALL.map(({ house, src }, index) => (
            <figure
              key={src}
              className="group relative break-inside-avoid overflow-hidden rounded-[18px] bg-[#1d1815]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={`${house} — pieza icónica`}
                loading={index < 4 ? "eager" : "lazy"}
                className="w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]"
              />
              <figcaption className="liquid-glass pointer-events-none absolute bottom-2.5 left-2.5 rounded-full px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-content opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                {house}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </div>
  );
}
