"use client";

import { useEffect, useRef, useState } from "react";
import { cleanEmbedUrl, ytPoster, type MediaClip } from "@/lib/house-media";

/**
 * Iframe de video "solo video" que se autoreproduce (mute, loop) sin clics.
 * — El iframe se monta al acercarse al viewport (IntersectionObserver) para
 *   no cargar N reproductores de golpe; `eager` lo monta de inmediato.
 * — El player de TikTok muestra usuario/contadores incluso con controls=0,
 *   así que se recorta con una escala (cover) que deja SOLO el video.
 * — Nunca se bloquea por prefers-reduced-motion: el requisito del negocio es
 *   que el escaparate esté en movimiento (probado con Chrome real: los
 *   players quedaban en póster para usuarios con animaciones de Windows off).
 */
export default function VideoFrame({
  clip,
  className = "",
  rounded = "rounded-[22px]",
  eager = false
}: {
  clip: MediaClip;
  className?: string;
  rounded?: string;
  eager?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(eager);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (mounted || !ref.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setMounted(true);
          observer.disconnect();
        }
      },
      { rootMargin: "360px" }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [mounted]);

  const portrait = clip.orientation === "portrait";
  const poster = clip.platform === "youtube" ? ytPoster(clip.id) : undefined;
  // Recorte del chrome de TikTok (rail de iconos a la derecha, autor abajo):
  // el iframe se escala y el contenedor lo recorta — queda solo el video.
  const crop = clip.platform === "tiktok" ? 1.42 : 1;

  return (
    <div
      ref={ref}
      className={`relative overflow-hidden bg-[#0d0b09] ${rounded} ${className}`}
      style={{ aspectRatio: portrait ? "9 / 16" : "16 / 9" }}
    >
      {/* Póster de respaldo bajo el iframe (miniatura o degradado) */}
      {poster ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={poster}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full scale-110 object-cover opacity-70 blur-[2px]"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-[#2c2620] via-[#191512] to-black" />
      )}

      {mounted && (
        <iframe
          src={cleanEmbedUrl(clip)}
          title={clip.label}
          tabIndex={-1}
          aria-hidden
          onLoad={() => setLoaded(true)}
          className="pointer-events-none absolute left-1/2 top-1/2 h-full w-full"
          style={{
            transform: `translate(-50%, -50%) scale(${crop})`,
            opacity: loaded ? 1 : 0,
            transition: "opacity 500ms var(--ease-out)"
          }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      )}
    </div>
  );
}
