"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";

export default function ProductGallery({ srcs, alt }: { srcs: string[]; alt: string }) {
  const images = useMemo(() => [...new Set(srcs.filter(Boolean))], [srcs]);
  const [idx, setIdx] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const current = images[Math.min(idx, images.length - 1)] ?? images[0];

  const move = (delta: number) => {
    if (images.length < 2) return;
    setIdx((value) => (value + delta + images.length) % images.length);
  };

  useEffect(() => {
    if (!zoomed) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setZoomed(false);
      if (event.key === "ArrowLeft") move(-1);
      if (event.key === "ArrowRight") move(1);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [zoomed, images.length]);

  if (!current) return null;

  return (
    <div>
      <div className="relative aspect-square overflow-hidden rounded-editorial bg-surface ring-1 ring-line">
        <button
          type="button"
          onClick={() => setZoomed(true)}
          className="absolute inset-0 z-10 cursor-zoom-in"
          aria-label="Ampliar imagen del producto"
        />
        <Image
          key={current}
          src={current}
          alt={`${alt}, vista ${idx + 1}`}
          fill
          sizes="(max-width:1024px) 100vw, 50vw"
          className="object-contain p-6 sm:p-10"
          priority
        />

        <span className="absolute left-3 top-3 z-20 rounded-full bg-bg/85 px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-muted backdrop-blur">
          Vista {idx + 1} de {images.length}
        </span>
        <span className="pointer-events-none absolute right-3 top-3 z-20 rounded-full bg-bg/85 px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-muted backdrop-blur">
          Ampliar
        </span>

        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={(event) => { event.stopPropagation(); move(-1); }}
              className="absolute left-3 top-1/2 z-30 -translate-y-1/2 rounded-full bg-bg/90 px-3 py-2 text-xl text-content shadow-lift ring-1 ring-line transition hover:bg-surface"
              aria-label="Vista anterior"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={(event) => { event.stopPropagation(); move(1); }}
              className="absolute right-3 top-1/2 z-30 -translate-y-1/2 rounded-full bg-bg/90 px-3 py-2 text-xl text-content shadow-lift ring-1 ring-line transition hover:bg-surface"
              aria-label="Vista siguiente"
            >
              ›
            </button>
          </>
        )}
      </div>

      {images.length > 1 && (
        <div className="mt-3 grid grid-cols-6 gap-2" role="tablist" aria-label="Vistas del producto">
          {images.map((src, imageIndex) => (
            <button
              key={`${src}-${imageIndex}`}
              type="button"
              onClick={() => setIdx(imageIndex)}
              role="tab"
              aria-selected={imageIndex === idx}
              aria-label={`Mostrar vista ${imageIndex + 1}`}
              className={`relative aspect-square overflow-hidden rounded-md bg-surface2 ring-1 transition ${
                imageIndex === idx ? "ring-accent" : "ring-line opacity-70 hover:opacity-100"
              }`}
            >
              <Image src={src} alt="" fill sizes="96px" className="object-contain p-1.5" />
            </button>
          ))}
        </div>
      )}

      {zoomed && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Vista ampliada de ${alt}`}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm sm:p-8"
          onClick={() => setZoomed(false)}
        >
          <button
            type="button"
            onClick={() => setZoomed(false)}
            className="absolute right-4 top-4 z-20 rounded-full bg-white/10 px-4 py-2 text-2xl text-white ring-1 ring-white/25 hover:bg-white/20"
            aria-label="Cerrar imagen ampliada"
          >
            ×
          </button>
          <div className="relative h-full w-full max-w-6xl" onClick={(event) => event.stopPropagation()}>
            <Image
              key={`zoom-${current}`}
              src={current}
              alt={`${alt}, vista ampliada ${idx + 1}`}
              fill
              sizes="100vw"
              className="object-contain"
            />
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => move(-1)}
                  className="absolute left-0 top-1/2 -translate-y-1/2 rounded-full bg-white/10 px-4 py-3 text-3xl text-white ring-1 ring-white/25 hover:bg-white/20"
                  aria-label="Vista anterior ampliada"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={() => move(1)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 rounded-full bg-white/10 px-4 py-3 text-3xl text-white ring-1 ring-white/25 hover:bg-white/20"
                  aria-label="Vista siguiente ampliada"
                >
                  ›
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
