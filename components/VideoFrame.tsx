"use client";

import { useEffect, useRef, useState } from "react";
import { cleanEmbedUrl, ytPoster, type MediaClip } from "@/lib/house-media";

/**
 * Iframe de video "solo video" que se autoreproduce (mute, loop) cuando entra
 * al viewport — sin clic, sin chrome de TikTok/YouTube. El iframe se monta
 * recién al acercarse (IntersectionObserver) para no cargar N reproductores
 * de golpe, y detrás siempre hay un póster para que nunca se vea un hueco.
 * `pointer-events: none`: el video es ambiente, no navegación accidental.
 * Con prefers-reduced-motion se queda en el póster (sin movimiento).
 */
export default function VideoFrame({
  clip,
  className = "",
  rounded = "rounded-[22px]"
}: {
  clip: MediaClip;
  className?: string;
  rounded?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);

  useEffect(() => {
    if (reduced || !ref.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setMounted(true);
          observer.disconnect();
        }
      },
      { rootMargin: "280px" }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [reduced]);

  const aspect = clip.orientation === "portrait" ? "9 / 16" : "16 / 9";
  const poster = clip.platform === "youtube" ? ytPoster(clip.id) : undefined;

  return (
    <div
      ref={ref}
      className={`relative overflow-hidden bg-[#0d0b09] ${rounded} ${className}`}
      style={{ aspectRatio: aspect }}
    >
      {/* Póster de respaldo bajo el iframe (miniatura o degradado de la casa) */}
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
          className="pointer-events-none absolute inset-0 h-full w-full"
          style={{
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
