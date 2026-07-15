"use client";

import { useState } from "react";
import Image from "next/image";
import type { WatchOfficialMedia } from "@/lib/watch-official-media";

/**
 * Archivo visual del fabricante. No simula piezas internas: cada imagen o
 * video se muestra únicamente después de validar la referencia oficial.
 */
export default function WatchShowcase3D({
  src,
  alt,
  media
}: {
  src: string;
  alt: string;
  media: WatchOfficialMedia;
}) {
  const [mode, setMode] = useState<"technical" | "video" | "product">(
    media.technicalImage ? "technical" : media.videoUrl ? "video" : "product"
  );
  const visual = mode === "technical" ? media.technicalImage : media.images[0] || src;

  return (
    <section className="mt-24">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="eyebrow">Galería oficial</p>
          <div className="rule-gold mt-3" />
          <h2 className="mt-4 font-serif text-4xl text-content sm:text-5xl">
            El reloj, de cerca
          </h2>
        </div>
        <a
          href={media.officialUrl}
          target="_blank"
          rel="noreferrer"
          className="btn-ghost"
        >
          Ver ficha del fabricante ↗
        </a>
      </div>

      <div className="overflow-hidden rounded-[28px] border border-line bg-[#15110e] shadow-lift">
        <div className="grid lg:grid-cols-[1.5fr_0.5fr]">
          <div className="relative min-h-[420px] overflow-hidden sm:min-h-[620px]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_38%,rgba(198,163,106,0.18),transparent_58%)]" />
            {mode === "video" && media.videoUrl ? (
              <video
                className="relative z-10 h-full min-h-[420px] w-full object-contain sm:min-h-[620px]"
                src={media.videoUrl}
                poster={media.images[0]}
                controls
                playsInline
                preload="metadata"
              />
            ) : visual ? (
              <Image
                key={`${mode}-${visual}`}
                src={visual}
                alt={mode === "technical" ? `Vista técnica oficial de ${alt}` : alt}
                fill
                sizes="(max-width:1024px) 100vw, 72vw"
                className={`fade-up object-contain ${mode === "technical" ? "p-0" : "p-8 sm:p-12"}`}
              />
            ) : null}
            <span className="absolute left-4 top-4 z-20 rounded-full bg-black/55 px-4 py-2 text-xs uppercase tracking-[0.18em] text-white backdrop-blur">
              {mode === "technical" ? "Detalles oficiales" : mode === "video" ? "Video oficial" : "Vista de producto"}
            </span>
          </div>

          <div className="relative z-20 flex flex-col justify-between border-t border-white/10 bg-black/25 p-6 text-white lg:border-l lg:border-t-0 sm:p-8">
            <div>
              <p className="text-xs uppercase tracking-luxe text-white/55">Selecciona la experiencia</p>
              <div className="mt-5 space-y-2">
                {media.technicalImage && (
                  <button type="button" onClick={() => setMode("technical")} className={`w-full rounded-2xl border px-4 py-3 text-left transition ${mode === "technical" ? "border-accent bg-accent/15" : "border-white/15 hover:border-white/40"}`}>
                    Vista técnica
                  </button>
                )}
                {media.videoUrl && (
                  <button type="button" onClick={() => setMode("video")} className={`w-full rounded-2xl border px-4 py-3 text-left transition ${mode === "video" ? "border-accent bg-accent/15" : "border-white/15 hover:border-white/40"}`}>
                    Video del modelo
                  </button>
                )}
                <button type="button" onClick={() => setMode("product")} className={`w-full rounded-2xl border px-4 py-3 text-left transition ${mode === "product" ? "border-accent bg-accent/15" : "border-white/15 hover:border-white/40"}`}>
                  Producto completo
                </button>
              </div>
            </div>
            <p className="mt-8 text-sm leading-relaxed text-white/60">
              Imágenes y video oficiales de {media.brand}.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
