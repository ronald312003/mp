"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

const GENDERS = [
  { value: "men", label: "Hombre" },
  { value: "women", label: "Mujer" },
  { value: "all", label: "Ver todo" }
];

const TYPES = [
  { value: "all", label: "Todo" },
  { value: "clothing", label: "Ropa" },
  { value: "shoes", label: "Zapatos" },
  { value: "watch", label: "Relojes" },
  { value: "perfume", label: "Perfumes" }
];

const OCCASIONS = [
  { value: "casual", label: "Día a día", hint: "Cómodo y bien resuelto" },
  { value: "oficina", label: "Oficina", hint: "Pulido y profesional" },
  { value: "noche", label: "Noche", hint: "Cena, evento o celebración" },
  { value: "verano", label: "Viaje", hint: "Ligero y versátil" },
  { value: "elegante", label: "Regalo", hint: "Una elección especial" }
];

export default function StyleConcierge({ brands }: { brands: string[] }) {
  const [gender, setGender] = useState("men");
  const [type, setType] = useState("all");
  const [occasion, setOccasion] = useState("casual");
  const [brand, setBrand] = useState("all");

  const href = useMemo(() => {
    const params = new URLSearchParams();
    if (gender !== "all") params.set("gender", gender);
    if (type !== "all") params.set("type", type);
    if (occasion) params.set("occasion", occasion);
    if (brand !== "all") params.set("brand", brand);
    return `/tienda?${params.toString()}`;
  }, [brand, gender, occasion, type]);

  return (
    <div className="rounded-[28px] border border-line bg-surface p-5 shadow-lift sm:p-7">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="eyebrow">Tu selección</p>
          <h2 className="mt-2 font-serif text-3xl leading-tight text-content">
            Cuéntanos qué necesitas
          </h2>
        </div>
        <span className="rounded-full bg-surface2 px-3 py-1.5 text-sm text-muted">1 minuto</span>
      </div>

      <fieldset className="mt-7">
        <legend className="text-base font-semibold text-content">¿Para quién estás buscando?</legend>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {GENDERS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setGender(option.value)}
              aria-pressed={gender === option.value}
              className={`rounded-2xl border px-3 py-3 text-sm font-medium transition sm:text-base ${
                gender === option.value
                  ? "border-accent bg-accent text-accent-fg"
                  : "border-line bg-bg text-content hover:border-accent"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="mt-7">
        <legend className="text-base font-semibold text-content">¿Qué estás buscando?</legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {TYPES.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setType(option.value)}
              aria-pressed={type === option.value}
              className={`rounded-full border px-4 py-2.5 text-sm font-medium transition sm:text-base ${
                type === option.value
                  ? "border-accent bg-accent text-accent-fg"
                  : "border-line bg-bg text-content hover:border-accent"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="mt-7">
        <legend className="text-base font-semibold text-content">¿Para qué ocasión?</legend>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {OCCASIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setOccasion(option.value)}
              aria-pressed={occasion === option.value}
              className={`rounded-2xl border p-3.5 text-left transition ${
                occasion === option.value
                  ? "border-accent bg-surface2"
                  : "border-line bg-bg hover:border-accent"
              }`}
            >
              <span className="block text-base font-semibold text-content">{option.label}</span>
              <span className="mt-0.5 block text-sm text-muted">{option.hint}</span>
            </button>
          ))}
        </div>
      </fieldset>

      <label className="mt-7 block text-base font-semibold text-content" htmlFor="concierge-brand">
        ¿Tienes alguna marca en mente?
      </label>
      <select
        id="concierge-brand"
        value={brand}
        onChange={(event) => setBrand(event.target.value)}
        className="field mt-3"
      >
        <option value="all">No, quiero descubrir</option>
        {brands.map((item) => (
          <option key={item} value={item}>{item}</option>
        ))}
      </select>

      <Link href={href} className="btn-accent mt-7 w-full text-center">
        Ver mi selección
      </Link>
      <Link href="/tienda" className="mt-4 block text-center text-sm font-medium text-muted hover:text-content">
        Prefiero explorar todo
      </Link>
    </div>
  );
}
