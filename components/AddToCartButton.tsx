"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart, type CartProduct } from "./CartProvider";

export default function AddToCartButton({ product }: { product: CartProduct }) {
  const { add } = useCart();
  const router = useRouter();
  const [added, setAdded] = useState(false);

  const addProduct = () => {
    add(product);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  };

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <button type="button" onClick={addProduct} className="btn-primary w-full py-4">
        {added ? "Añadido a la bolsa ✓" : "Añadir a la bolsa"}
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
