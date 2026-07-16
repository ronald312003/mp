"use client";

import { brandGallery, pinterestSearch, type MediaClip } from "@/lib/house-media";
import VideoFrame from "./VideoFrame";

/**
 * Media de la casa dentro de su ficha en /casas:
 * — Los clips verificados se autoreproducen (solo video, sin chrome) al
 *   entrar al viewport; no hace falta ningún clic.
 * — Debajo, un mosaico de imágenes reales scrapeadas de Pinterest (fijas en
 *   data/brand-gallery.json). Todas las casas tienen al menos el mosaico.
 */
export default function HouseMediaStrip({
  house,
  signature,
  clips
}: {
  house: string;
  signature?: string;
  clips: MediaClip[];
}) {
  // Solo las 3 principales: una grande + dos de apoyo.
  const photos = brandGallery(house, 3);
  if (!clips.length && !photos.length) return null;

  return (
    <div className="mt-5 rounded-2xl border border-line bg-surface2 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs uppercase tracking-luxe text-muted">
          Archivo visual{signature ? ` · ${signature}` : ""}
        </p>
        <a
          href={pinterestSearch(house)}
          target="_blank"
          rel="noreferrer"
          className="text-xs font-medium text-accent transition-colors duration-200 hover:text-accent-strong"
        >
          Pinterest ↗
        </a>
      </div>

      {clips.length > 0 && (
        <div className="no-scrollbar mt-4 flex gap-3 overflow-x-auto pb-1">
          {clips.map((clip) => (
            <figure
              key={clip.id}
              className={`relative shrink-0 ${
                clip.orientation === "portrait" ? "w-[150px]" : "w-[280px]"
              }`}
            >
              <VideoFrame clip={clip} rounded="rounded-xl" />
              <figcaption className="pointer-events-none absolute inset-x-1.5 bottom-1.5 truncate rounded-lg bg-black/55 px-2 py-1 text-[10px] text-white/85 backdrop-blur-sm">
                {clip.label}
              </figcaption>
            </figure>
          ))}
        </div>
      )}

      {photos.length > 0 && (
        <div className="mt-4 grid grid-cols-3 gap-2">
          {photos.map((src, index) => (
            <figure
              key={src}
              className={`group relative overflow-hidden rounded-lg bg-surface ${
                index === 0 ? "col-span-2 row-span-2" : ""
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={`${house} — archivo visual`}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
                style={{ aspectRatio: index === 0 ? "auto" : "1 / 1" }}
              />
            </figure>
          ))}
        </div>
      )}
    </div>
  );
}
