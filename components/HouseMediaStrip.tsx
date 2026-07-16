"use client";

import Image from "next/image";
import { useState } from "react";
import type { MediaClip } from "@/lib/house-media";

/**
 * Tira de media por casa en /casas: reproduce los clips oficiales (YouTube o
 * TikTok) de la marca y enlaza a Pinterest para descubrir más piezas. El clip
 * seleccionado se abre en línea (sin salir de la ficha). Si la casa aún no
 * tiene clips curados, mostramos sólo la vía de descubrimiento en Pinterest,
 * de modo que TODAS las casas ofrecen algo visual.
 */

function ytPoster(id: string): string {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}

function embedUrl(clip: MediaClip): string {
  if (clip.platform === "youtube") {
    return `https://www.youtube-nocookie.com/embed/${clip.id}?autoplay=1&mute=1&rel=0&modestbranding=1&playsinline=1`;
  }
  return `https://www.tiktok.com/embed/v2/${clip.id}`;
}

export default function HouseMediaStrip({
  house,
  signature,
  clips,
  pinterest
}: {
  house: string;
  signature?: string;
  clips: MediaClip[];
  pinterest: string;
}) {
  const [active, setActive] = useState<MediaClip | null>(null);
  const isVertical = active?.platform === "tiktok";

  return (
    <div className="mt-5 rounded-2xl border border-line bg-surface2 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs uppercase tracking-luxe text-muted">
          En movimiento{signature ? ` · ${signature}` : ""}
        </p>
        <a
          href={pinterest}
          target="_blank"
          rel="noreferrer"
          className="text-xs font-medium text-accent transition hover:text-accent-strong"
        >
          Pinterest ↗
        </a>
      </div>

      {active && (
        <div
          className="relative mx-auto mt-4 overflow-hidden rounded-xl bg-black ring-1 ring-line"
          style={{
            aspectRatio: isVertical ? "9 / 16" : "16 / 9",
            maxWidth: isVertical ? 320 : "none"
          }}
        >
          <iframe
            key={active.id}
            src={embedUrl(active)}
            title={`${house} · ${active.label}`}
            className="absolute inset-0 h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
      )}

      {clips.length > 0 ? (
        <div className="no-scrollbar mt-4 flex gap-3 overflow-x-auto pb-1">
          {clips.map((clip) => {
            const selected = active?.id === clip.id;
            return (
              <button
                key={clip.id}
                type="button"
                onClick={() => setActive(selected ? null : clip)}
                aria-pressed={selected}
                className={`group relative aspect-video w-40 shrink-0 overflow-hidden rounded-lg ring-1 transition ${
                  selected ? "ring-2 ring-accent" : "ring-line hover:ring-accent"
                }`}
              >
                {clip.platform === "youtube" ? (
                  <Image
                    src={ytPoster(clip.id)}
                    alt={clip.label}
                    fill
                    unoptimized
                    sizes="160px"
                    className="object-cover transition duration-500 ease-out group-hover:scale-105"
                  />
                ) : (
                  <span className="absolute inset-0 bg-gradient-to-br from-[#2c2620] via-[#1c1814] to-black" />
                )}
                <span className="absolute inset-0 bg-black/25" />
                <span className="absolute left-1/2 top-1/2 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 ring-1 ring-white/40 backdrop-blur-sm transition group-hover:scale-110">
                  <svg viewBox="0 0 24 24" className="ml-0.5 h-4 w-4 fill-white" aria-hidden="true">
                    <path d={selected ? "M6 5h4v14H6zM14 5h4v14h-4z" : "M8 5v14l11-7z"} />
                  </svg>
                </span>
                <span className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/80 to-transparent px-2 py-1.5 text-left text-[10px] text-white/85">
                  {clip.platform === "tiktok" ? "TikTok" : "YouTube"} · {clip.label}
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Explora campañas y editoriales de {house} en Pinterest mientras sumamos sus clips oficiales.
        </p>
      )}
    </div>
  );
}
