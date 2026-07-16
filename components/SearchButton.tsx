"use client";

import { openSearch } from "./SearchOverlay";

/** Botón del header que abre la búsqueda global (también ⌘K / Ctrl+K). */
export default function SearchButton() {
  return (
    <button
      type="button"
      onClick={openSearch}
      aria-label="Buscar piezas, marcas y casas"
      className="flex h-11 items-center gap-2 rounded-2xl border border-line px-3 text-content transition-transform duration-150 ease-out hover:border-accent active:scale-95 sm:px-3.5"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.2-3.2" />
      </svg>
      <span className="hidden text-sm font-medium text-muted lg:inline">Buscar</span>
      <kbd className="hidden rounded-md border border-line px-1.5 py-0.5 text-[10px] font-semibold text-muted lg:inline">⌘K</kbd>
    </button>
  );
}
