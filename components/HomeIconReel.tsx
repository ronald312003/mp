"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { ICONIC_PIECES, type IconicPiece, type Accent } from "@/lib/house-media";

/**
 * Muro de piezas icónicas del home: la suela roja de Louboutin, el tacón-logo
 * de Saint Laurent, las sandalias joya de Jimmy Choo… Cada tarjeta abre un
 * lightbox con el clip oficial (YouTube o TikTok). Portada por miniatura
 * estable o, si no hay, un póster tipográfico con el color de firma — nunca
 * imágenes rotas. Motion siguiendo la guía de Emil: entrada del modal con
 * scale(0.97)+opacity y ease-out; el fondo no bloquea el scroll del reel.
 */

const ACCENT_TAG: Record<Accent, string> = {
  rouge: "bg-rouge text-rouge-fg",
  gold: "bg-accent text-accent-fg",
  ink: "bg-inverse text-inverse-fg"
};

const ACCENT_POSTER: Record<Accent, string> = {
  rouge: "from-rouge-strong via-rouge to-[#3a0d10]",
  gold: "from-accent-strong via-accent to-[#2a1c0f]",
  ink: "from-[#2c2620] via-[#1c1814] to-black"
};

function embedUrl(piece: IconicPiece): string {
  const { platform, id } = piece.clip;
  if (platform === "youtube") {
    return `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&mute=1&rel=0&modestbranding=1&playsinline=1&loop=1&playlist=${id}`;
  }
  return `https://www.tiktok.com/embed/v2/${id}`;
}

function PieceCard({ piece, onPlay }: { piece: IconicPiece; onPlay: () => void }) {
  return (
    <article className="group relative snap-center overflow-hidden rounded-[24px] border border-line bg-inverse text-white shadow-soft transition-shadow duration-300 hover:shadow-lift">
      <button
        type="button"
        onClick={onPlay}
        aria-label={`Reproducir ${piece.house} ${piece.piece}`}
        className="relative block aspect-[3/4] w-full overflow-hidden text-left"
      >
        {piece.poster ? (
          <>
            <Image
              src={piece.poster}
              alt={`${piece.house} ${piece.piece}`}
              fill
              unoptimized
              sizes="(max-width: 640px) 78vw, (max-width: 1024px) 44vw, 24vw"
              className="object-cover opacity-90 transition duration-[900ms] ease-out group-hover:scale-[1.06] group-hover:opacity-100"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
          </>
        ) : (
          <div className={`absolute inset-0 bg-gradient-to-br ${ACCENT_POSTER[piece.accent]}`}>
            <span className="absolute inset-0 flex items-center justify-center font-serif text-[7rem] leading-none text-white/12 transition duration-[900ms] ease-out group-hover:scale-[1.08]">
              {piece.house.charAt(0)}
            </span>
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
          </div>
        )}

        {/* Botón de play (aparece/realza en hover) */}
        <span className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 backdrop-blur-md ring-1 ring-white/40 transition duration-300 ease-out group-hover:scale-110 group-hover:bg-white/25">
          <svg viewBox="0 0 24 24" className="ml-0.5 h-6 w-6 fill-white" aria-hidden="true">
            <path d="M8 5v14l11-7z" />
          </svg>
        </span>

        {/* Etiqueta de firma */}
        <span className={`absolute left-4 top-4 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${ACCENT_TAG[piece.accent]}`}>
          {piece.signature}
        </span>

        <div className="absolute inset-x-0 bottom-0 p-5">
          <p className="text-[10px] uppercase tracking-[0.2em] text-white/60">{piece.house}</p>
          <h3 className="mt-1 font-serif text-2xl leading-tight">{piece.piece}</h3>
          <p className="mt-2 max-w-[26ch] text-sm leading-snug text-white/75">{piece.note}</p>
        </div>
      </button>
    </article>
  );
}

function Lightbox({ piece, onClose }: { piece: IconicPiece; onClose: () => void }) {
  const [shown, setShown] = useState(false);
  const isVertical = piece.clip.platform === "tiktok";

  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(true));
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      cancelAnimationFrame(id);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${piece.house} ${piece.piece}`}
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8"
      style={{
        background: "rgb(0 0 0 / 0.72)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        opacity: shown ? 1 : 0,
        transition: "opacity 220ms var(--ease-out)"
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full ${isVertical ? "max-w-[400px]" : "max-w-4xl"}`}
        style={{
          transform: shown ? "scale(1)" : "scale(0.97)",
          opacity: shown ? 1 : 0,
          transition: "transform 260ms var(--ease-out), opacity 260ms var(--ease-out)"
        }}
      >
        <div className="mb-3 flex items-end justify-between gap-4 text-white">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/60">{piece.house}</p>
            <h3 className="font-serif text-2xl leading-tight">{piece.piece}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="rounded-full bg-white/10 px-3 py-1.5 text-sm text-white/80 ring-1 ring-white/25 transition hover:bg-white/20 active:scale-[0.97]"
          >
            Cerrar ✕
          </button>
        </div>
        <div
          className="relative overflow-hidden rounded-[20px] bg-black ring-1 ring-white/15"
          style={{ aspectRatio: isVertical ? "9 / 16" : "16 / 9" }}
        >
          <iframe
            key={piece.clip.id}
            src={embedUrl(piece)}
            title={`${piece.house} · ${piece.piece}`}
            className="absolute inset-0 h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-white/60">
          <span>{piece.clip.label}</span>
          <a href={piece.pinterest} target="_blank" rel="noreferrer" className="text-white/70 transition hover:text-white">
            Más piezas en Pinterest ↗
          </a>
        </div>
      </div>
    </div>
  );
}

export default function HomeIconReel() {
  const [active, setActive] = useState<number | null>(null);
  const close = useCallback(() => setActive(null), []);

  return (
    <div>
      <div className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 lg:grid lg:grid-cols-3 lg:overflow-visible xl:grid-cols-6">
        {ICONIC_PIECES.map((piece, index) => (
          <div key={`${piece.house}-${piece.piece}`} className="min-w-[76vw] sm:min-w-[44vw] lg:min-w-0">
            <PieceCard piece={piece} onPlay={() => setActive(index)} />
          </div>
        ))}
      </div>
      {active !== null && <Lightbox piece={ICONIC_PIECES[active]} onClose={close} />}
    </div>
  );
}
