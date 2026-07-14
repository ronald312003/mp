"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

/**
 * Anatomía del reloj — recorrido 3D animado, tipo video, sobre la FOTO REAL.
 *  - Etapas de zoom con perspectiva y foco de luz por componente.
 *  - Etapa final "Despiece": la imagen se SEPARA físicamente en capas
 *    (correa superior · caja y corona · esfera y cristal · correa inferior)
 *    con profundidad 3D, engranajes del calibre y etiquetas.
 * Se reproduce solo (barra de progreso, pausa, salto por componente).
 */

type Stage = {
  key: string;
  title: string;
  desc: string;
  x: number;
  y: number;
  scale: number;
  ring?: number;
  gears?: boolean;
  exploded?: boolean;
};

const STAGES: Stage[] = [
  {
    key: "vista",
    title: "Vista completa",
    desc: "Las proporciones de la caja y el equilibrio del diseño.",
    x: 50, y: 50, scale: 1
  },
  {
    key: "bisel",
    title: "Bisel & cristal",
    desc: "El anillo que corona la caja y protege el cristal.",
    x: 50, y: 26, scale: 1.7, ring: 120
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
    desc: "Hora, fecha y cuerda: el punto de ajuste de la pieza.",
    x: 74, y: 48, scale: 2.4, ring: 60
  },
  {
    key: "mecanismo",
    title: "Mecanismo",
    desc: "Bajo la esfera late el calibre: engranajes en armonía.",
    x: 50, y: 50, scale: 1.9, ring: 110, gears: true
  },
  {
    key: "despiece",
    title: "Despiece",
    desc: "La pieza se separa: correa, caja, esfera y cristal.",
    x: 50, y: 50, scale: 0.92, gears: true, exploded: true
  }
];

const STAGE_MS = 4200;

// Capas del despiece: máscaras sobre la MISMA foto real.
const LAYERS = [
  {
    key: "correa-sup",
    label: "Correa / brazalete",
    mask: "linear-gradient(to bottom, black 0%, black 30%, transparent 37%)",
    open: "translateY(-24%) translateZ(-20px) rotateX(14deg)",
    labelPos: { top: "8%" }
  },
  {
    key: "caja",
    label: "Caja & corona",
    mask: "linear-gradient(to bottom, transparent 27%, black 34%, black 62%, transparent 69%)",
    open: "translateZ(10px)",
    labelPos: { top: "47%" }
  },
  {
    key: "esfera",
    label: "Esfera & cristal",
    mask: "radial-gradient(circle at 50% 47%, black 0 19%, transparent 23%)",
    open: "translateZ(120px) translateY(-4%) scale(1.05)",
    labelPos: { top: "30%" }
  },
  {
    key: "correa-inf",
    label: "Correa / hebilla",
    mask: "linear-gradient(to bottom, transparent 59%, black 66%, black 100%)",
    open: "translateY(24%) translateZ(-20px) rotateX(-14deg)",
    labelPos: { top: "86%" }
  }
];

function Gears({ visible, strong }: { visible: boolean; strong?: boolean }) {
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
        visible ? (strong ? "opacity-90" : "opacity-70") : "opacity-0"
      }`}
    >
      <svg viewBox="0 0 200 200" className="h-3/4 w-3/4" aria-hidden>
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
  const [tick, setTick] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stage = STAGES[i];
  const exploded = Boolean(stage.exploded);

  useEffect(() => {
    if (!playing) return;
    timer.current = setTimeout(() => {
      setI((v) => (v + 1) % STAGES.length);
      setTick((t) => t + 1);
    }, stage.exploded ? STAGE_MS + 1600 : STAGE_MS);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [i, playing, stage.exploded]);

  const goTo = (n: number) => {
    setI(n);
    setTick((t) => t + 1);
  };

  return (
    <section className="mt-24">
      <div className="mb-8">
        <p className="eyebrow">Experiencia 3D</p>
        <div className="rule-gold mt-3" />
        <h2 className="mt-4 font-serif text-4xl text-content sm:text-5xl">Anatomía del reloj</h2>
      </div>

      <div className="overflow-hidden rounded-editorial ring-1 ring-line">
        <div className="grid lg:grid-cols-[3fr_2fr]">
          {/* Escenario 3D */}
          <div className="relative aspect-square overflow-hidden bg-[#17120e] sm:aspect-[4/3] lg:aspect-auto lg:min-h-[560px] [perspective:1300px]">
            <div
              className="absolute inset-0"
              style={{
                background: "radial-gradient(60% 55% at 50% 42%, rgba(198,163,106,0.16), transparent 70%)"
              }}
            />

            {/* --- Modo recorrido: foto completa con zoom por etapa --- */}
            <div
              className={`absolute inset-0 transition-all duration-[1400ms] ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform ${
                exploded ? "opacity-0" : "opacity-100"
              }`}
              style={{
                transformOrigin: `${stage.x}% ${stage.y}%`,
                transform: `scale(${exploded ? 1 : stage.scale})`
              }}
            >
              <div className="mp-watch-float absolute inset-0">
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
                />
              </div>
              <Gears visible={Boolean(stage.gears) && !exploded} />
            </div>

            {/* --- Modo DESPIECE: la misma foto separada en capas reales --- */}
            <div
              className={`absolute inset-0 transition-opacity duration-700 ${
                exploded ? "opacity-100" : "pointer-events-none opacity-0"
              }`}
            >
              <div
                className="absolute inset-0 transition-transform duration-[1600ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
                style={{
                  transform: exploded ? "rotateX(26deg) rotateY(-10deg) scale(0.86)" : "none",
                  transformStyle: "preserve-3d"
                }}
              >
                {/* engranajes del calibre, detrás de la esfera levantada */}
                <Gears visible={exploded} strong />

                {LAYERS.map((layer, n) => (
                  <div
                    key={layer.key}
                    className="absolute inset-0 transition-transform duration-[1600ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
                    style={{
                      transform: exploded ? layer.open : "none",
                      transitionDelay: `${n * 120}ms`,
                      transformStyle: "preserve-3d"
                    }}
                  >
                    <Image
                      src={src}
                      alt=""
                      aria-hidden
                      fill
                      sizes="(max-width:1024px) 100vw, 60vw"
                      className="object-contain p-10 drop-shadow-[0_18px_26px_rgba(0,0,0,0.45)]"
                      style={{
                        WebkitMaskImage: layer.mask,
                        maskImage: layer.mask
                      }}
                    />
                  </div>
                ))}
              </div>

              {/* etiquetas de componente */}
              {LAYERS.map((layer, n) => (
                <span
                  key={`lbl-${layer.key}`}
                  className={`absolute right-4 z-20 flex items-center gap-2 transition-all duration-700 ${
                    exploded ? "translate-x-0 opacity-100" : "translate-x-4 opacity-0"
                  }`}
                  style={{ top: layer.labelPos.top, transitionDelay: `${500 + n * 160}ms` }}
                >
                  <span className="h-px w-8 bg-accent/80" />
                  <span className="rounded-full bg-black/55 px-3 py-1.5 text-xs uppercase tracking-[0.16em] text-white backdrop-blur">
                    {layer.label}
                  </span>
                </span>
              ))}
            </div>

            {/* foco de luz sobre la parte destacada (solo recorrido) */}
            {!exploded && (
              <>
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
              </>
            )}

            {/* barra de progreso tipo video */}
            <div className="absolute inset-x-0 bottom-0 z-20 h-[3px] bg-white/10">
              <div
                key={tick}
                className="h-full bg-accent"
                style={{
                  animation: playing
                    ? `mp-progress ${stage.exploded ? STAGE_MS + 1600 : STAGE_MS}ms linear forwards`
                    : "none",
                  width: playing ? undefined : "100%"
                }}
              />
            </div>
            <style>{`@keyframes mp-progress { from { width: 0% } to { width: 100% } }`}</style>

            <button
              type="button"
              onClick={() => setPlaying((v) => !v)}
              aria-label={playing ? "Pausar recorrido" : "Reproducir recorrido"}
              className="absolute bottom-4 right-4 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-white/25 backdrop-blur transition hover:bg-white/20"
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

            <span className="absolute left-4 top-4 z-20 rounded-full bg-black/45 px-3.5 py-1.5 text-xs uppercase tracking-[0.2em] text-white/90 backdrop-blur">
              {i + 1} / {STAGES.length} · {stage.title}
            </span>
          </div>

          {/* Guion del recorrido */}
          <div className="flex flex-col justify-between bg-surface p-6 sm:p-8">
            <div>
              <p className="text-xs uppercase tracking-luxe text-muted">Componente</p>
              <h3 className="mt-2 font-serif text-3xl text-content">{stage.title}</h3>
              <p className="mt-3 text-base leading-relaxed text-muted">{stage.desc}</p>
            </div>

            <ol className="mt-8 space-y-1.5">
              {STAGES.map((s, n) => (
                <li key={s.key}>
                  <button
                    type="button"
                    onClick={() => goTo(n)}
                    aria-current={n === i}
                    className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-base transition ${
                      n === i
                        ? "bg-surface2 text-content ring-1 ring-accent/50"
                        : "text-muted hover:bg-surface2/60 hover:text-content"
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${n === i ? "bg-accent" : "bg-line"}`} />
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
