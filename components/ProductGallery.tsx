"use client";

import { useRef, useState } from "react";
import Image from "next/image";

/**
 * Visor de producto con galería y efecto 3D:
 *  - la imagen principal se inclina siguiendo el cursor (perspectiva)
 *  - un brillo suave acompaña el movimiento (acabado "vitrina")
 *  - miniaturas para cambiar entre las vistas del producto
 */
export default function ProductGallery({ srcs, alt }: { srcs: string[]; alt: string }) {
  const [idx, setIdx] = useState(0);
  const frameRef = useRef<HTMLDivElement>(null);
  const [fx, setFx] = useState({ rx: 0, ry: 0, gx: 50, gy: 50 });

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = frameRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width; // 0..1
    const py = (e.clientY - r.top) / r.height;
    setFx({
      ry: (px - 0.5) * 14, // giro horizontal
      rx: (0.5 - py) * 10, // giro vertical
      gx: px * 100,
      gy: py * 100
    });
  }
  const reset = () => setFx({ rx: 0, ry: 0, gx: 50, gy: 50 });

  const main = srcs[Math.min(idx, srcs.length - 1)] ?? srcs[0];

  return (
    <div>
      <div
        ref={frameRef}
        onMouseMove={onMove}
        onMouseLeave={reset}
        className="group relative aspect-square overflow-hidden rounded-editorial bg-surface ring-1 ring-line [perspective:1100px]"
      >
        <div
          className="absolute inset-0 transition-transform duration-200 ease-out will-change-transform"
          style={{
            transform: `rotateX(${fx.rx}deg) rotateY(${fx.ry}deg) scale(1.04)`,
            transformStyle: "preserve-3d"
          }}
        >
          <Image
            key={main}
            src={main}
            alt={alt}
            fill
            sizes="(max-width:1024px) 100vw, 50vw"
            className="object-contain p-8"
            priority
          />
        </div>

        {/* brillo que sigue al cursor */}
        <div
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            background: `radial-gradient(420px circle at ${fx.gx}% ${fx.gy}%, rgba(255,255,255,0.16), transparent 62%)`
          }}
        />

        {srcs.length > 1 && (
          <span className="absolute bottom-3 right-3 rounded-full bg-bg/85 px-2.5 py-0.5 text-[10px] uppercase tracking-[0.16em] text-muted backdrop-blur">
            Vista {idx + 1} / {srcs.length}
          </span>
        )}
      </div>

      {srcs.length > 1 && (
        <div className="mt-3 grid grid-cols-6 gap-2">
          {srcs.map((s, i) => (
            <button
              key={s + i}
              type="button"
              onClick={() => setIdx(i)}
              aria-label={`Vista ${i + 1}`}
              className={`relative aspect-square overflow-hidden rounded-md bg-surface2 ring-1 transition ${
                i === idx ? "ring-accent" : "ring-line opacity-70 hover:opacity-100"
              }`}
            >
              <Image src={s} alt="" fill sizes="80px" className="object-contain p-1.5" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
