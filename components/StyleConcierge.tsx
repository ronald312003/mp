"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

/**
 * Curaduría en 4 pasos: una pregunta por pantalla, tipografía grande,
 * transición suave y auto-avance al elegir. Menos texto, más claro.
 */

const GENDERS = [
  { value: "men", label: "Él" },
  { value: "women", label: "Ella" },
  { value: "all", label: "Todo" }
];

const TYPES = [
  { value: "all", label: "Todo" },
  { value: "clothing", label: "Ropa" },
  { value: "shoes", label: "Zapatos" },
  { value: "watch", label: "Relojes" },
  { value: "perfume", label: "Perfumes" }
];

const OCCASIONS = [
  { value: "casual", label: "Día a día" },
  { value: "oficina", label: "Oficina" },
  { value: "noche", label: "Noche" },
  { value: "verano", label: "Viaje" },
  { value: "elegante", label: "Regalo" }
];

const STEPS = ["¿Para quién?", "¿Qué buscas?", "¿La ocasión?", "¿Una casa favorita?"];

export default function StyleConcierge({ brands }: { brands: string[] }) {
  const [step, setStep] = useState(0);
  const [gender, setGender] = useState<string | null>(null);
  const [type, setType] = useState<string | null>(null);
  const [occasion, setOccasion] = useState<string | null>(null);
  const [brand, setBrand] = useState("all");
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const href = useMemo(() => {
    const params = new URLSearchParams();
    if (gender && gender !== "all") params.set("gender", gender);
    if (type && type !== "all") params.set("type", type);
    if (occasion) params.set("occasion", occasion);
    if (brand !== "all") params.set("brand", brand);
    const qs = params.toString();
    return qs ? `/tienda?${qs}` : "/tienda";
  }, [brand, gender, occasion, type]);

  useEffect(
    () => () => {
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
    },
    []
  );

  const goToStep = (value: number) => {
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    advanceTimer.current = null;
    setStep(Math.max(0, Math.min(value, STEPS.length - 1)));
  };

  const pick = (setter: (v: string) => void) => (value: string) => {
    setter(value);
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    advanceTimer.current = setTimeout(() => {
      setStep((current) => Math.min(current + 1, STEPS.length - 1));
      advanceTimer.current = null;
    }, 220); // deja ver la selección y avanza solo
  };

  const bigBtn = (active: boolean) =>
    `min-h-14 min-w-0 rounded-2xl border px-1.5 py-3 font-serif text-base leading-tight transition-all duration-300 min-[390px]:px-3 min-[390px]:text-lg sm:px-5 sm:py-4 sm:text-2xl ${
      active
        ? "border-accent bg-accent text-accent-fg shadow-lift"
        : "border-line bg-bg text-content hover:-translate-y-0.5 hover:border-accent hover:shadow-lift"
    }`;

  return (
    <div className="min-w-0 max-w-full overflow-hidden rounded-[28px] border border-line bg-surface shadow-lift">
      {/* progreso */}
      <div className="flex items-center justify-between px-6 pt-6 sm:px-8">
        <div className="flex gap-2">
          {STEPS.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Paso ${i + 1}`}
              aria-current={i === step ? "step" : undefined}
              disabled={i >= step}
              onClick={() => goToStep(i)}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                i === step ? "w-8 bg-accent" : i < step ? "w-4 bg-accent/50" : "w-4 bg-line"
              }`}
            />
          ))}
        </div>
        <span className="text-sm text-muted">
          {step + 1} / {STEPS.length}
        </span>
      </div>

      {/* pasos (carril deslizante) */}
      <div className="relative min-w-0 overflow-hidden">
        <div
          className="flex w-full min-w-0 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{ transform: `translateX(-${step * 100}%)` }}
        >
          {/* 1 · ¿Para quién? */}
          <section className="w-full min-w-0 shrink-0 p-5 sm:p-8" aria-hidden={step !== 0}>
            <h2 className="font-serif text-[1.75rem] text-content sm:text-4xl">{STEPS[0]}</h2>
            <div className="mt-5 grid grid-cols-3 gap-2 sm:mt-6 sm:gap-3">
              {GENDERS.map((o) => (
                <button key={o.value} type="button" disabled={step !== 0} onClick={() => pick(setGender)(o.value)} className={bigBtn(gender === o.value)}>
                  {o.label}
                </button>
              ))}
            </div>
          </section>

          {/* 2 · ¿Qué buscas? */}
          <section className="w-full min-w-0 shrink-0 p-5 sm:p-8" aria-hidden={step !== 1}>
            <h2 className="font-serif text-[1.75rem] text-content sm:text-4xl">{STEPS[1]}</h2>
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {TYPES.map((o) => (
                <button key={o.value} type="button" disabled={step !== 1} onClick={() => pick(setType)(o.value)} className={bigBtn(type === o.value)}>
                  {o.label}
                </button>
              ))}
            </div>
          </section>

          {/* 3 · ¿La ocasión? */}
          <section className="w-full min-w-0 shrink-0 p-5 sm:p-8" aria-hidden={step !== 2}>
            <h2 className="font-serif text-[1.75rem] text-content sm:text-4xl">{STEPS[2]}</h2>
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {OCCASIONS.map((o) => (
                <button key={o.value} type="button" disabled={step !== 2} onClick={() => pick(setOccasion)(o.value)} className={bigBtn(occasion === o.value)}>
                  {o.label}
                </button>
              ))}
            </div>
          </section>

          {/* 4 · ¿Una casa favorita? */}
          <section className="w-full min-w-0 shrink-0 p-5 sm:p-8" aria-hidden={step !== 3}>
            <h2 className="font-serif text-[1.75rem] text-content sm:text-4xl">{STEPS[3]}</h2>
            <select
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              disabled={step !== 3}
              aria-label="Casa de moda"
              className="field mt-6 text-lg"
            >
              <option value="all">Quiero descubrir</option>
              {brands.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>

            <Link href={href} tabIndex={step === 3 ? 0 : -1} className="btn-accent mt-6 block w-full py-4 text-center text-lg">
              Ver mi selección
            </Link>
          </section>
        </div>
      </div>

      {/* pie: atrás / saltar */}
      <div className="flex items-center justify-between border-t border-line px-6 py-4 sm:px-8">
        <button
          type="button"
          onClick={() => goToStep(step - 1)}
          className={`text-base font-medium transition ${
            step === 0 ? "pointer-events-none opacity-0" : "text-muted hover:text-content"
          }`}
        >
          ← Atrás
        </button>
        <Link href="/tienda" className="text-base font-medium text-muted transition hover:text-content">
          Explorar todo
        </Link>
      </div>
    </div>
  );
}
