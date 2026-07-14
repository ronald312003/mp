"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

/**
 * Anatomía del reloj — recorrido 3D animado, tipo video.
 * Usa la FOTO REAL del reloj: la cámara recorre cada parte (bisel, esfera,
 * manecillas, corona, mecanismo, correa) haciendo zoom con perspectiva 3D,
 * un foco de luz resalta la zona y una tarjeta explica el componente.
 * Se reproduce solo (con barra de progreso); se puede pausar o saltar
 * a una parte tocando su nombre.
 */

type Stage = {
  key: string;
  title: string;
  desc: string;
  x: number; // punto de enfoque (% desde la izquierda)
  y: number; // punto de enfoque (% desde arriba)
  scale: number;
  ring?: number; // radio del aro de foco (px sobre 640)
  gears?: boolean; // mostrar mecanismo animado
};

const STAGES: Stage[] = [
  {
    key: "vista",
    title: "Vista completa",
    desc: "Aprecia las proporciones de la caja y el equilibrio del diseño.",
    x: 50, y: 50, scale: 1
  },
  {
    key: "bisel",
    title: "Bisel & cristal",
    desc: "El anillo que corona la caja y protege el cristal endurecido.",
    x: 50, y: 22, scale: 1.7, ring: 120
  },
  {
    key: "esfera",
    title: "Esfera & manecillas",
    desc: "Índices y agujas calibrados para una lectura impecable.",
    x: 50, y: 47, scale: 2.1, ring: 95
  },
  {
    key: "corona",
    title: "Corona",
    desc: "El punto de ajuste: hora, fecha y cuerda, sellado contra el agua.",
    x: 76, y: 48, scale: 2.4, ring: 60
  },
  {
    key: "mecanismo",
    title: "Mecanismo",
    desc: "Bajo la esfera late el calibre: engranajes, rotor y escape en armonía.",
    x: 50, y: 50, scale: 1.9, ring: 110, gears: true
  },
  {
    key: "correa",
    title: "Correa / brazalete",
    desc: "Eslabones y hebilla que completan el porte en la muñeca.",
    x: 50, y: 84, scale: 1.8, ring: 110
  }
];

const STAGE_MS = 3600;

function Gears({ visible }: { visible: boolean }) {
  // Engranajes decorativos del calibre (SVG animado, tono dorado).
  const tooth = (cx: number, cy: number, r: number, n: number) => {
    const pts: string[] = [];
    for (let i = 0; i < n * 2; i++) {
      const rad = i % 2 === 0 ? r : r * 0.78;
      const a = (Math.PI * i) / n;
      pts.push(`${cx + rad * Math.cos(a)},${cy + rad * Math.sin(a)}`);
    }
    return pts.join(" ");
  };
  return (
    <div
      className={`pointer-events-none absolute inset-0 flex items-center justify-center transition-opacity duration-700 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      <svg viewBox="0 0 200 200" className="h-3/4 w-3/4 opacity-70" aria-hidden>
        <g className="mp-gear" style={{ transformBox: "fill-box" }}>
          <polygon points={tooth(100, 100, 46, 12)} fill="none" stroke="rgb(198 163 106 / 0.9)" strokeWidth="2" />
          <circle cx="100" cy="100" r="12" fill="none" stroke="rgb(198 163 106 / 0.9)" strokeWidth="2" />
        </g>
        <g className="mp-gear-rev" style={{ transformBox: "fill-box" }}>
          <polygon points={tooth(152, 66, 26, 9)} fill="none" stroke="rgb(198 163 106 / 0.7)" strokeWidth="1.6" />
          <circle cx="152" cy="66" r="7" fill="none" stroke="rgb(198 163 106 / 0.7)" strokeWidth="1.6" />
        </g>
        <g className="mp-gear-rev" style={{ transformBox: "fill-box" }}>
          <polygon points={tooth(56, 146, 20, 8)} fill="none" stroke="rgb(198 163 106 / 0.6)" strokeWidth="1.4" />
          <circle cx="56" cy="146" r="5" fill="none" stroke="rgb(198 163 106 / 0.6)" strokeWidth="1.4" />
        </g>
      </svg>
    </div>
  );
}

export default function WatchShowcase3D({ src, alt }: { src: string; alt: string }) {
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [tick, setTick] = useState(0); // reinicia la barra de progreso
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stage = STAGES[i];

  useEffect(() => {
    if (!playing) return;
    timer.current = setTimeout(() => {
      setI((v) => (v + 1) % STAGES.length);
      setTick((t) => t + 1);
    }, STAGE_MS);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [i, playing]);

  const goTo = (n: number) => {
    setI(n);
    setTick((t) => t + 1);
  };

  return (
    <section className="mt-24">
      <div className="mb-8">
        <p className="eyebrow">Experiencia 3D</p>
        <div className="rule-gold mt-3" />
        <h2 className="mt-4 font-serif text-3xl text-content sm:text-4xl">Anatomía del reloj</h2>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Un recorrido animado por cada componente de la pieza, tal como se aprecia en vitrina.
        </p>
      </div>

      <div className="overflow-hidden rounded-editorial ring-1 ring-line">
        <div className="grid lg:grid-cols-[3fr_2fr]">
          {/* Escenario 3D */}
          <div className="relative aspect-square overflow-hidden bg-[#17120e] sm:aspect-[4/3] lg:aspect-auto lg:min-h-[520px] [perspective:1200px]">
            {/* halo de vitrina */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(60% 55% at 50% 42%, rgba(198,163,106,0.16), transparent 70%)"
              }}
            />

            {/* reloj (foto real) con zoom/rotación por etapa */}
            <div
              className="absolute inset-0 transition-transform duration-[1400ms] ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform"
              style={{
                transformOrigin: `${stage.x}% ${stage.y}%`,
                transform: `scale(${stage.scale})`
              }}
            >
              <div className="mp-watch-float absolute inset-0">
                {/* sombra proyectada (profundidad) */}
                <Image
                  src={src}
                  alt=""
                  aria-hidden
                  fill
                  sizes="(max-width:1024px) 100vw, 60vw"
                  className="object-contain p-10 opacity-40 blur-md brightness-0"
                  style={{ transform: "translateZ(-60px) translateY(14px) scale(0.98)" }}
                />
                <Image
                  src={src}
                  alt={alt}
                  fill
                  sizes="(max-width:1024px) 100vw, 60vw"
                  className="object-contain p-10 drop-shadow-[0_24px_36px_rgba(0,0,0,0.5)]"
                  style={{ transform: "translateZ(0px)" }}
                  priority={false}
                />
              </div>
              <Gears visible={Boolean(stage.gears)} />
            </div>

            {/* foco de luz sobre la parte destacada */}
            <div
              className="pointer-events-none absolute inset-0 transition-all duration-1000"
              style={{
                background:
                  stage.ring !== undefined
                    ? `radial-gradient(circle at ${stage.x}% ${stage.y}%, transparent ${stage.ring}px, rgba(10,7,5,0.55) ${stage.ring * 1.9}px)`
                    : "transparent"
              }}
            />
            {stage.ring !== undefined && (
              <div
                className="pointer-events-none absolute rounded-full border border-accent/80 shadow-[0_0_30px_rgba(198,163,106,0.35)] transition-all duration-1000"
                style={{
                  left: `${stage.x}%`,
                  top: `${stage.y}%`,
                  width: stage.ring * 1.15,
                  height: stage.ring * 1.15,
                  transform: "translate(-50%, -50%)"
                }}
              />
            )}

            {/* barra de progreso tipo video */}
            <div className="absolute inset-x-0 bottom-0 z-20 h-[3px] bg-white/10">
              <div
                key={tick}
                className="h-full bg-accent"
                style={{
                  animation: playing ? `mp-progress ${STAGE_MS}ms linear forwards` : "none",
                  width: playing ? undefined : "100%"
                }}
              />
            </div>
            <style>{`@keyframes mp-progress { from { width: 0% } to { width: 100% } }`}</style>

            {/* control reproducir / pausar */}
            <button
              type="button"
              onClick={() => setPlaying((v) => !v)}
              aria-label={playing ? "Pausar recorrido" : "Reproducir recorrido"}
              className="absolute bottom-4 right-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-white/25 backdrop-blur transition hover:bg-white/20"
            >
              {playing ? (
                <svg width="12" height="14" viewBox="0 0 12 14" fill="currentColor" aria-hidden>
                  <rect x="1" y="1" width="3.5" height="12" rx="1" />
                  <rect x="7.5" y="1" width="3.5" height="12" rx="1" />
                </svg>
              ) : (
                <svg width="12" height="14" viewBox="0 0 12 14" fill="currentColor" aria-hidden>
                  <path d="M2 1.5v11a1 1 0 0 0 1.5.87l9-5.5a1 1 0 0 0 0-1.74l-9-5.5A1 1 0 0 0 2 1.5z" />
                </svg>
              )}
            </button>

            <span className="absolute left-4 top-4 z-20 rounded-full bg-black/45 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-white/90 backdrop-blur">
              {i + 1} / {STAGES.length} · {stage.title}
            </span>
          </div>

          {/* Guion del recorrido */}
          <div className="flex flex-col justify-between bg-surface p-6 sm:p-8">
            <div>
              <p className="text-[11px] uppercase tracking-luxe text-muted">Componente</p>
              <h3 className="mt-2 font-serif text-2xl text-content">{stage.title}</h3>
              <p className="mt-3 text-[15px] leading-relaxed text-muted">{stage.desc}</p>
            </div>

            <ol className="mt-8 space-y-1.5">
              {STAGES.map((s, n) => (
                <li key={s.key}>
                  <button
                    type="button"
                    onClick={() => goTo(n)}
                    aria-current={n === i}
                    className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition ${
                      n === i
                        ? "bg-surface2 text-content ring-1 ring-accent/50"
                        : "text-muted hover:bg-surface2/60 hover:text-content"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                        n === i ? "bg-accent" : "bg-line"
                      }`}
                    />
                    {s.title}
                  </button>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
