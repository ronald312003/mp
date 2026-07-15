"use client";

import { useState } from "react";

const FILMS = [
  {
    id: "iOmPnjZQWxc",
    title: "TSUYOSA 37 mm",
    house: "CITIZEN",
    channel: "https://www.youtube.com/@CITIZEN-MIDDLE-EAST"
  },
  {
    id: "YuyX_j8Blwc",
    title: "Cómo funciona Eco-Drive",
    house: "Citizen México",
    channel: "https://www.youtube.com/@citizenmexico"
  },
  {
    id: "EoacYKP_3wE",
    title: "Eco-Drive E365",
    house: "CITIZEN",
    channel: "https://www.youtube.com/@CITIZEN-MIDDLE-EAST"
  },
  {
    id: "CP3hyKej-U4",
    title: "PRX 38 mm en titanio",
    house: "TISSOT",
    channel: "https://www.youtube.com/@TISSOT"
  }
] as const;

export default function HomeFilmRoom() {
  const [selected, setSelected] = useState(0);
  const film = FILMS[selected];
  const embed = `https://www.youtube-nocookie.com/embed/${film.id}?autoplay=1&mute=1&controls=1&playsinline=1&rel=0&modestbranding=1&loop=1&playlist=${film.id}`;

  return (
    <div className="overflow-hidden rounded-[30px] border border-white/10 bg-[#17120f] text-white shadow-lift">
      <div className="grid min-w-0 lg:grid-cols-[0.34fr_0.66fr]">
        <div className="flex min-w-0 flex-col justify-between p-6 sm:p-9 lg:p-10">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/50">Maison en movimiento</p>
            <h2 className="mt-4 max-w-md font-serif text-4xl leading-[0.98] sm:text-5xl">El diseño se entiende mejor cuando se mueve.</h2>

          </div>

          <div className="no-scrollbar mt-8 flex min-w-0 max-w-full gap-2 overflow-x-auto pb-1 lg:block lg:space-y-2 lg:overflow-visible">
            {FILMS.map((item, index) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelected(index)}
                aria-pressed={selected === index}
                className={`min-w-[190px] rounded-2xl border px-4 py-3 text-left transition lg:block lg:w-full ${
                  selected === index
                    ? "border-[#d7b488] bg-white/10 text-white"
                    : "border-white/10 text-white/55 hover:border-white/30 hover:text-white"
                }`}
              >
                <span className="block text-[9px] uppercase tracking-[0.18em] opacity-65">{item.house}</span>
                <span className="mt-1 block text-sm font-medium">{item.title}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="relative min-w-0 min-h-[230px] overflow-hidden bg-black lg:min-h-0" style={{ aspectRatio: "16 / 9" }}>
          <iframe
            key={film.id}
            src={embed}
            title={`${film.title} · ${film.house}`}
            className="absolute inset-0 h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
          <div className="pointer-events-none absolute left-4 top-4 rounded-full bg-black/55 px-3 py-1.5 text-[9px] uppercase tracking-[0.18em] text-white/80 backdrop-blur">
            Video oficial
          </div>
          <div className="absolute bottom-3 right-3 flex gap-2">
            <a href={film.channel} target="_blank" rel="noreferrer" className="hidden rounded-full bg-black/60 px-3 py-1.5 text-[9px] text-white/75 backdrop-blur hover:text-white sm:block">
              Canal {film.house} ↗
            </a>
            <a href={`https://www.youtube.com/watch?v=${film.id}`} target="_blank" rel="noreferrer" className="rounded-full bg-black/60 px-3 py-1.5 text-[9px] text-white/75 backdrop-blur hover:text-white">
              YouTube ↗
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
