"use client";

import { useState } from "react";
import Link from "next/link";
import SmartImage from "./SmartImage";
import ProductCard, { type ProductCardData } from "./ProductCard";
import type { StyleVisual } from "@/lib/style-visuals";

export interface LookData {
  aud: "m" | "w";
  title: string; // Para él / Para ella
  note: string | null;
  ctxTitle: string; // Invierno, Noche…
  ctxBg: string; // degradado del ambiente
  products: ProductCardData[];
  visuals: StyleVisual[];
}

/**
 * "Completa el look": tablero con la pieza principal + los complementos del
 * catálogo. En productos UNISEX muestra dos looks (Para él / Para ella) con
 * transición suave. Los visuales ilustran exactamente lo que dice la nota
 * (piezas reales del catálogo y notas olfativas).
 */
export default function RecoLook({
  looks,
  rate,
  mainSrc,
  mainBrand,
  mainName
}: {
  looks: LookData[];
  rate: number;
  mainSrc: string;
  mainBrand: string;
  mainName: string;
}) {
  const [i, setI] = useState(0);
  const look = looks[Math.min(i, looks.length - 1)];
  if (!look) return null;

  return (
    <div className="overflow-hidden rounded-editorial ring-1 ring-line">
      {/* Ambiente + nota del estilista */}
      <div className="relative p-6 transition-all duration-700 sm:p-8" style={{ background: look.ctxBg }}>
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{ background: "radial-gradient(80% 120% at 85% 0%, rgba(255,255,255,0.18), transparent 60%)" }}
        />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <span className="rounded-full bg-black/25 px-4 py-1.5 text-xs uppercase tracking-[0.2em] text-white backdrop-blur">
            Pensado para {look.ctxTitle}
          </span>

          {/* Tabs Él / Ella (solo unisex) */}
          {looks.length > 1 && (
            <div className="flex rounded-full bg-black/25 p-1 backdrop-blur">
              {looks.map((l, n) => (
                <button
                  key={l.aud}
                  type="button"
                  onClick={() => setI(n)}
                  aria-pressed={n === i}
                  className={`rounded-full px-5 py-2 font-serif text-base transition-all duration-300 sm:text-lg ${
                    n === i ? "bg-white text-black shadow" : "text-white/85 hover:text-white"
                  }`}
                >
                  {l.title}
                </button>
              ))}
            </div>
          )}
        </div>

        {look.note && (
          <p
            key={look.aud}
            className="fade-up relative mt-4 max-w-3xl font-serif text-xl leading-snug text-white sm:text-2xl"
          >
            “{look.note}”
          </p>
        )}
      </div>

      {/* Tablero del look */}
      <div key={`board-${look.aud}`} className="fade-up grid gap-0 bg-surface lg:grid-cols-[1fr_2.2fr]">
        <div className="flex flex-col border-b border-line p-6 lg:border-b-0 lg:border-r">
          <p className="text-xs uppercase tracking-luxe text-muted">Tu pieza</p>
          <div className="relative mt-3 min-h-[220px] flex-1 overflow-hidden rounded-md bg-surface2 ring-1 ring-line">
            <SmartImage src={mainSrc} alt={`${mainBrand} ${mainName}`} fill sizes="(max-width:1024px) 100vw, 25vw" className="object-contain p-6" />
          </div>
          <p className="mt-3 text-base text-content">
            <span className="eyebrow block">{mainBrand}</span>
            <span className="line-clamp-2">{mainName}</span>
          </p>
        </div>

        <div className="p-6 sm:p-8">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {look.products.map((p) => (
              <ProductCard key={`${look.aud}-${p.id}`} product={p} rate={rate} />
            ))}
          </div>

          {/* Visuales de lo que dice la nota */}
          {look.visuals.length > 0 && (
            <div className="mt-7 border-t border-line pt-5">
              <p className="text-xs uppercase tracking-luxe text-muted">En este look</p>
              <div className="mt-3 flex flex-wrap gap-4">
                {look.visuals.map((v) => {
                  const chip = (
                    <span className="group/vis flex items-center gap-3">
                      <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full ring-1 ring-line transition group-hover/vis:ring-accent">
                        <SmartImage src={v.src} alt={v.label} fill sizes="64px" className="object-cover" />
                      </span>
                      <span className="text-base font-medium text-content">{v.label}</span>
                    </span>
                  );
                  return v.href ? (
                    <Link key={v.label} href={v.href} className="transition hover:-translate-y-0.5">
                      {chip}
                    </Link>
                  ) : (
                    <span key={v.label}>{chip}</span>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
