"use client";

import { useEffect, useMemo, useState } from "react";
import SmartImage from "./SmartImage";

export default function ProductGallery({ srcs, alt }: { srcs: string[]; alt: string }) {
  const images = useMemo(() => [...new Set(srcs.filter(Boolean))], [srcs]);
  const [idx, setIdx] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const [view, setView] = useState<"full" | "detail" | "finish">("full");
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
    <div className="min-w-0 max-w-full">
      <div className="relative aspect-square overflow-hidden rounded-editorial bg-surface ring-1 ring-line">
        <button
          type="button"
          onClick={() => setZoomed(true)}
          className="absolute inset-0 z-10 cursor-zoom-in"
          aria-label="Ampliar imagen del producto"
        />
        <SmartImage
          key={current}
          src={current}
          alt={`${alt}, vista ${idx + 1}`}
          fill
          sizes="(max-width:1024px) 100vw, 50vw"
          className={`object-contain p-5 transition-[transform,transform-origin] duration-700 sm:p-10 ${
            view === "detail"
              ? "origin-center scale-[1.62]"
              : view === "finish"
                ? "origin-[62%_38%] scale-[2.15]"
                : "origin-center scale-100"
          }`}
          priority
        />

        {images.length > 1 && (
          <span className="absolute left-3 top-3 z-20 rounded-full bg-bg/85 px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-muted backdrop-blur">
            Vista {idx + 1} de {images.length}
          </span>
        )}
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
        <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1 sm:grid sm:grid-cols-6" role="tablist" aria-label="Vistas del producto">
          {images.map((src, imageIndex) => (
            <button
              key={`${src}-${imageIndex}`}
              type="button"
              onClick={() => setIdx(imageIndex)}
              role="tab"
              aria-selected={imageIndex === idx}
              aria-label={`Mostrar vista ${imageIndex + 1}`}
              className={`relative aspect-square w-16 shrink-0 overflow-hidden rounded-xl bg-surface2 ring-1 transition sm:w-auto ${
                imageIndex === idx ? "ring-accent" : "ring-line opacity-70 hover:opacity-100"
              }`}
            >
              <SmartImage src={src} alt="" fill sizes="96px" className="object-contain p-1.5" />
            </button>
          ))}
        </div>
      )}

      {images.length === 1 && (
        <div className="mt-3 min-w-0 max-w-full overflow-hidden rounded-2xl border border-line bg-surface p-2 sm:flex sm:items-center sm:justify-between">
          <p className="min-w-0 break-words px-2 pb-2 text-sm leading-snug text-muted sm:pb-0">Acércate a la pieza:</p>
          <div className="grid min-w-0 grid-cols-3 rounded-xl bg-surface2 p-1 sm:flex">
            {([
              ["full", "Completa"],
              ["detail", "Detalle"],
              ["finish", "Acabado"]
            ] as const).map(([mode, label]) => (
              <button
                key={mode}
                type="button"
                onClick={() => setView(mode)}
                aria-pressed={view === mode}
                className={`min-h-11 min-w-0 rounded-lg px-1.5 py-2 text-[11px] font-medium transition min-[390px]:px-3 min-[390px]:text-xs ${view === mode ? "bg-bg text-content shadow-soft" : "text-muted"}`}
              >
                {label}
              </button>
            ))}
          </div>
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
            <SmartImage
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
