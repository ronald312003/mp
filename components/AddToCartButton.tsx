"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart, type CartProduct } from "./CartProvider";

/**
 * "Añadir a la bolsa" con confirmación morfológica (guía de Emil Kowalski):
 * una capa de éxito se revela con clip-path (acelerada por hardware) mientras
 * las etiquetas hacen crossfade con blur sutil, y el check se dibuja a trazo.
 * CSS transitions (no keyframes) para que sea interrumpible si se pulsa
 * varias veces seguidas.
 */
export default function AddToCartButton({ product }: { product: CartProduct }) {
  const { add } = useCart();
  const router = useRouter();
  const [added, setAdded] = useState(false);
  const timer = useRef<number>();

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const addProduct = () => {
    add(product);
    setAdded(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <button
        type="button"
        onClick={addProduct}
        aria-live="polite"
        className="btn-primary relative w-full overflow-hidden py-4"
      >
        {/* Capa de éxito (se revela de izquierda a derecha) */}
        <span
          aria-hidden
          className={`addcart-overlay absolute inset-0 bg-accent ${added ? "is-on" : ""}`}
        />
        <span className={`addcart-label relative ${added ? "is-hidden" : ""}`}>
          Añadir a la bolsa
        </span>
        <span
          className={`addcart-label absolute inset-0 flex items-center justify-center gap-2 text-accent-fg ${added ? "is-on" : "is-hidden"}`}
          aria-hidden={!added}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path className="addcart-check" d="M4.5 12.5l5 5 10-11" />
          </svg>
          En la bolsa
        </span>
      </button>
      <button
        type="button"
        onClick={() => { add(product); router.push("/checkout"); }}
        className="btn-accent w-full"
      >
        Comprar ahora
      </button>
    </div>
  );
}
