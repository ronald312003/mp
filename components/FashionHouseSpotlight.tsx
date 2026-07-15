"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

export interface HouseSpotlightItem {
  name: string;
  origin: string;
  since: string;
  identity: string;
  imageUrl: string;
  imageAlt: string;
  anchor: string;
}

export default function FashionHouseSpotlight({ houses }: { houses: HouseSpotlightItem[] }) {
  const [active, setActive] = useState(0);
  const stage = useRef<HTMLDivElement>(null);
  const house = houses[active];

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || houses.length < 2) return;
    const timer = window.setInterval(() => setActive((value) => (value + 1) % houses.length), 6500);
    return () => window.clearInterval(timer);
  }, [houses.length]);

  if (!house) return null;

  return (
    <section className="container-shell py-12 sm:py-16">
      <div
        ref={stage}
        onPointerMove={(event) => {
          const box = event.currentTarget.getBoundingClientRect();
          stage.current?.style.setProperty("--house-x", `${((event.clientX - box.left) / box.width - 0.5) * 14}px`);
          stage.current?.style.setProperty("--house-y", `${((event.clientY - box.top) / box.height - 0.5) * 10}px`);
        }}
        onPointerLeave={() => {
          stage.current?.style.setProperty("--house-x", "0px");
          stage.current?.style.setProperty("--house-y", "0px");
        }}
        className="house-stage relative min-h-[560px] overflow-hidden rounded-[32px] bg-[#18130f] text-white shadow-lift"
      >
        <Image key={house.name} src={house.imageUrl} alt={house.imageAlt} fill priority sizes="100vw" className="house-stage-image object-cover opacity-75" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/45 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
        <div className="relative z-10 flex min-h-[560px] max-w-2xl flex-col justify-end p-7 sm:p-12">
          <p className="text-xs uppercase tracking-[0.28em] text-white/65">{house.origin} · Desde {house.since}</p>
          <h2 key={`title-${house.name}`} className="fade-up mt-3 font-serif text-5xl leading-none sm:text-7xl">{house.name}</h2>
          <p key={`identity-${house.name}`} className="fade-up fade-up-2 mt-4 max-w-xl text-xl text-white/85 sm:text-2xl">{house.identity}</p>
          <a href={`#${house.anchor}`} className="mt-7 w-fit rounded-full border border-white/40 bg-black/20 px-6 py-3 text-sm font-semibold backdrop-blur transition hover:border-white hover:bg-white hover:text-black">Entrar a la casa</a>
        </div>
        <div className="absolute bottom-7 right-7 z-20 hidden items-center gap-3 sm:flex">
          <button type="button" onClick={() => setActive((active - 1 + houses.length) % houses.length)} className="flex h-12 w-12 items-center justify-center rounded-full border border-white/30 bg-black/25 text-2xl backdrop-blur hover:bg-white hover:text-black" aria-label="Casa anterior">‹</button>
          <span className="min-w-16 text-center text-sm tabular-nums text-white/70">{String(active + 1).padStart(2, "0")} / {String(houses.length).padStart(2, "0")}</span>
          <button type="button" onClick={() => setActive((active + 1) % houses.length)} className="flex h-12 w-12 items-center justify-center rounded-full border border-white/30 bg-black/25 text-2xl backdrop-blur hover:bg-white hover:text-black" aria-label="Casa siguiente">›</button>
        </div>
      </div>
      <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto pb-2">
        {houses.map((item, index) => (
          <button key={item.name} type="button" onClick={() => setActive(index)} className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm transition ${index === active ? "border-accent bg-accent text-accent-fg" : "border-line bg-surface text-muted hover:text-content"}`}>{item.name}</button>
        ))}
      </div>
    </section>
  );
}
