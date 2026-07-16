"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import SmartImage from "./SmartImage";
import { useCart } from "./CartProvider";

const money = (value: number, currency: "USD" | "PEN") =>
  new Intl.NumberFormat("es-PE", { style: "currency", currency }).format(value);

/**
 * Mini-carrito lateral: drawer a la derecha en liquid glass que se abre al
 * añadir una pieza. Entrada/salida con la curva de drawer iOS (Emil
 * Kowalski, --ease-drawer), salida más rápida que la entrada; items con
 * stagger corto; quitar con el mismo colapso .cart-row del carrito.
 */
export default function MiniCart({ rate }: { rate: number }) {
  const { items, count, totalUsd, drawerOpen, closeDrawer, setQuantity, remove } = useCart();
  const [removing, setRemoving] = useState<Set<string>>(new Set());
  const timers = useRef<Map<string, number>>(new Map());
  const panel = useRef<HTMLDivElement>(null);

  // Mantener montado durante la animación de salida.
  const [rendered, setRendered] = useState(false);
  useEffect(() => {
    if (drawerOpen) {
      setRendered(true);
      return;
    }
    const t = window.setTimeout(() => setRendered(false), 380);
    return () => window.clearTimeout(t);
  }, [drawerOpen]);

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && closeDrawer();
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [drawerOpen, closeDrawer]);

  const removeAnimated = (id: string) => {
    if (timers.current.has(id)) return;
    setRemoving((current) => new Set(current).add(id));
    timers.current.set(
      id,
      window.setTimeout(() => {
        remove(id);
        timers.current.delete(id);
        setRemoving((current) => {
          const next = new Set(current);
          next.delete(id);
          return next;
        });
      }, 300)
    );
  };

  if (!rendered && !drawerOpen) return null;

  return (
    <div className="fixed inset-0 z-[90]" role="dialog" aria-modal="true" aria-label="Tu bolsa">
      {/* Fondo */}
      <div
        onClick={closeDrawer}
        className="absolute inset-0 bg-black/45"
        style={{
          opacity: drawerOpen ? 1 : 0,
          transition: `opacity ${drawerOpen ? 320 : 220}ms var(--ease-out)`,
          backdropFilter: "blur(3px)",
          WebkitBackdropFilter: "blur(3px)"
        }}
      />
      {/* Panel */}
      <div
        ref={panel}
        className="liquid-glass absolute bottom-0 right-0 top-0 flex w-full max-w-[420px] flex-col rounded-l-[28px]"
        style={{
          transform: drawerOpen ? "translateX(0)" : "translateX(105%)",
          transition: `transform ${drawerOpen ? 420 : 300}ms var(--ease-drawer)`
        }}
      >
        <div className="flex items-center justify-between border-b border-line/70 px-6 py-5">
          <div>
            <p className="eyebrow">Tu bolsa</p>
            <p className="mt-1 font-serif text-2xl text-content">
              {count} {count === 1 ? "pieza" : "piezas"}
            </p>
          </div>
          <button
            type="button"
            onClick={closeDrawer}
            aria-label="Cerrar bolsa"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-line text-content transition-transform duration-150 ease-out hover:border-accent active:scale-90"
          >
            ✕
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <p className="font-serif text-2xl text-content">La bolsa está vacía.</p>
              <p className="mt-2 max-w-[26ch] text-sm text-muted">
                Explora la selección y guarda las piezas que te interesan.
              </p>
              <Link href="/tienda" onClick={closeDrawer} className="btn-ghost mt-6">
                Explorar
              </Link>
            </div>
          ) : (
            items.map((item, index) => (
              <div key={item.id} className={`cart-row ${removing.has(item.id) ? "is-removing" : ""}`}>
                <div
                  className="minicart-item pb-3"
                  style={{ animationDelay: `${Math.min(index, 6) * 45}ms` }}
                >
                  <article className="grid grid-cols-[72px_1fr] gap-3 rounded-2xl border border-line/70 bg-surface/70 p-3">
                    <Link
                      href={`/producto/${item.id}`}
                      onClick={closeDrawer}
                      className="relative aspect-square overflow-hidden rounded-xl bg-surface2"
                    >
                      <SmartImage src={item.imageSrc} alt={`${item.brand} ${item.name}`} fill sizes="72px" className="object-contain p-1.5" />
                    </Link>
                    <div className="min-w-0">
                      <p className="truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">{item.brand}</p>
                      <Link
                        href={`/producto/${item.id}`}
                        onClick={closeDrawer}
                        className="mt-0.5 line-clamp-1 text-sm font-medium text-content transition-colors duration-200 hover:text-accent"
                      >
                        {item.name}
                      </Link>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <div className="flex items-center rounded-full border border-line bg-bg p-0.5">
                          <button
                            type="button"
                            onClick={() => (item.quantity <= 1 ? removeAnimated(item.id) : setQuantity(item.id, item.quantity - 1))}
                            className="h-6 w-6 rounded-full text-sm text-content transition-transform duration-150 ease-out hover:bg-surface2 active:scale-90"
                            aria-label="Reducir cantidad"
                          >−</button>
                          <span key={item.quantity} className="qty-pop w-6 text-center text-xs text-content">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => setQuantity(item.id, item.quantity + 1)}
                            className="h-6 w-6 rounded-full text-sm text-content transition-transform duration-150 ease-out hover:bg-surface2 active:scale-90"
                            aria-label="Aumentar cantidad"
                          >+</button>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-content">{money(item.finalPriceUsd * item.quantity, "USD")}</p>
                          <button
                            type="button"
                            onClick={() => removeAnimated(item.id)}
                            className="text-[11px] text-muted transition-colors duration-200 hover:text-rouge"
                          >
                            Quitar
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                </div>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-line/70 px-6 py-5">
            <div className="flex items-end justify-between">
              <span className="text-sm text-muted">Total productos</span>
              <span className="text-right">
                <strong className="block font-serif text-2xl text-content">{money(totalUsd, "USD")}</strong>
                <small className="text-xs text-muted">{money(totalUsd * rate, "PEN")}</small>
              </span>
            </div>
            <Link href="/checkout" onClick={closeDrawer} className="btn-accent mt-4 w-full">
              Continuar al pedido
            </Link>
            <Link href="/carrito" onClick={closeDrawer} className="btn-ghost mt-2 w-full">
              Ver la bolsa completa
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
