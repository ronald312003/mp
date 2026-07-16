"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import SmartImage from "./SmartImage";

interface SearchProduct {
  id: string;
  brand: string;
  name: string;
  type: string;
  priceUsd: number;
  img: string;
}
interface SearchHouse {
  name: string;
  identity: string;
  slug: string;
}

const money = (value: number, currency: "USD" | "PEN") =>
  new Intl.NumberFormat("es-PE", { style: "currency", currency }).format(value);

/** El header (u otro componente) abre la búsqueda con este evento. */
export function openSearch() {
  window.dispatchEvent(new CustomEvent("mp:search"));
}

/**
 * Búsqueda global (piezas + casas) en overlay liquid glass. Se abre con el
 * botón del header o ⌘K / Ctrl+K; debounce de 220ms contra /api/search;
 * resultados con stagger corto (30-80ms, guía de Emil). Entrada del panel
 * scale(0.97)+fade con ease-out.
 */
export default function SearchOverlay({ rate }: { rate: number }) {
  const [open, setOpen] = useState(false);
  const [shown, setShown] = useState(false);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [products, setProducts] = useState<SearchProduct[]>([]);
  const [houses, setHouses] = useState<SearchHouse[]>([]);
  const input = useRef<HTMLInputElement>(null);
  const debounce = useRef<number>();
  const controller = useRef<AbortController>();

  const close = useCallback(() => {
    setShown(false);
    window.setTimeout(() => {
      setOpen(false);
      setQuery("");
      setProducts([]);
      setHouses([]);
    }, 220);
  }, []);

  useEffect(() => {
    const onOpen = () => {
      setOpen(true);
      requestAnimationFrame(() => {
        setShown(true);
        input.current?.focus();
      });
    };
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        onOpen();
      }
    };
    window.addEventListener("mp:search", onOpen);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mp:search", onOpen);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && close();
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open, close]);

  const search = (value: string) => {
    setQuery(value);
    window.clearTimeout(debounce.current);
    controller.current?.abort();
    if (value.trim().length < 2) {
      setProducts([]);
      setHouses([]);
      setBusy(false);
      return;
    }
    setBusy(true);
    debounce.current = window.setTimeout(async () => {
      controller.current = new AbortController();
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(value)}`, {
          signal: controller.current.signal
        });
        const data = await res.json();
        setProducts(data.products || []);
        setHouses(data.houses || []);
      } catch {}
      setBusy(false);
    }, 220);
  };

  if (!open) return null;
  const empty = query.trim().length >= 2 && !busy && !products.length && !houses.length;

  return (
    <div className="fixed inset-0 z-[95]" role="dialog" aria-modal="true" aria-label="Buscar">
      <div
        onClick={close}
        className="absolute inset-0 bg-black/45"
        style={{
          opacity: shown ? 1 : 0,
          transition: "opacity 220ms var(--ease-out)",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)"
        }}
      />
      <div
        className="liquid-glass absolute left-1/2 top-[9vh] w-[min(680px,92vw)] -translate-x-1/2 rounded-[26px] p-3"
        style={{
          transform: `translateX(-50%) scale(${shown ? 1 : 0.97})`,
          opacity: shown ? 1 : 0,
          transition: "transform 240ms var(--ease-out), opacity 240ms var(--ease-out)"
        }}
      >
        <div className="flex items-center gap-3 border-b border-line/70 px-3 pb-3 pt-1">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-muted" aria-hidden>
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.2-3.2" />
          </svg>
          <input
            ref={input}
            value={query}
            onChange={(event) => search(event.target.value)}
            placeholder="Busca piezas, marcas, casas… (Louboutin, reloj, perfume)"
            className="w-full bg-transparent text-base text-content outline-none placeholder:text-muted"
            aria-label="Buscar en Maison Privée"
          />
          {busy && <span className="spinner !h-4 !w-4 shrink-0" />}
          <button
            type="button"
            onClick={close}
            className="shrink-0 rounded-lg border border-line px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted transition-colors duration-150 hover:text-content"
          >
            Esc
          </button>
        </div>

        <div className="max-h-[58vh] overflow-y-auto p-2">
          {query.trim().length < 2 && (
            <p className="px-3 py-6 text-center text-sm text-muted">
              Escribe una marca, una pieza o una casa. Todo el catálogo, en un solo lugar.
            </p>
          )}
          {empty && (
            <p className="px-3 py-6 text-center text-sm text-muted">
              Nada con “{query}”. Prueba con la marca o el tipo de pieza.
            </p>
          )}

          {houses.length > 0 && (
            <div className="mb-1">
              <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Casas</p>
              {houses.map((house, index) => (
                <Link
                  key={house.slug}
                  href={`/casas/${house.slug}`}
                  onClick={close}
                  className="search-item flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors duration-150 hover:bg-surface2"
                  style={{ animationDelay: `${index * 40}ms` }}
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-inverse font-serif text-sm text-inverse-fg">
                    {house.name.charAt(0)}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-content">{house.name}</span>
                    <span className="block truncate text-xs text-muted">{house.identity}</span>
                  </span>
                  <span className="ml-auto text-xs text-muted">Casa →</span>
                </Link>
              ))}
            </div>
          )}

          {products.length > 0 && (
            <div>
              <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Piezas</p>
              {products.map((product, index) => (
                <Link
                  key={product.id}
                  href={`/producto/${product.id}`}
                  onClick={close}
                  className="search-item flex items-center gap-3 rounded-xl px-3 py-2 transition-colors duration-150 hover:bg-surface2"
                  style={{ animationDelay: `${(houses.length + index) * 40}ms` }}
                >
                  <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-surface2">
                    <SmartImage src={product.img} alt="" fill sizes="48px" className="object-contain p-1" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
                      {product.brand} · {product.type}
                    </span>
                    <span className="block truncate text-sm font-medium text-content">{product.name}</span>
                  </span>
                  <span className="ml-auto shrink-0 text-right">
                    <span className="block text-sm font-semibold text-content">{money(product.priceUsd, "USD")}</span>
                    <span className="block text-[11px] text-muted">{money(product.priceUsd * rate, "PEN")}</span>
                  </span>
                </Link>
              ))}
              <Link
                href={`/tienda?brand=${encodeURIComponent(products[0]?.brand || "")}`}
                onClick={close}
                className="mt-1 block rounded-xl px-3 py-2.5 text-center text-sm font-medium text-accent transition-colors duration-150 hover:bg-surface2"
              >
                Ver todo en la tienda →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
