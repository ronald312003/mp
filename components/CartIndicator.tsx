"use client";

import Link from "next/link";
import { useCart } from "./CartProvider";

export default function CartIndicator() {
  const { count, ready } = useCart();
  return (
    <Link
      href="/carrito"
      aria-label={`Bolsa de compra${count ? `, ${count} productos` : " vacía"}`}
      className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-line text-content transition hover:border-accent"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
        <path d="M6.5 8.5h11l1 12h-13l1-12Z" />
        <path d="M9 9V6a3 3 0 0 1 6 0v3" />
      </svg>
      {ready && count > 0 && (
        <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-accent-fg">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
