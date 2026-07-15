"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

export interface CartProduct {
  id: string;
  brand: string;
  name: string;
  finalPriceUsd: number;
  imageSrc: string;
}

export interface CartItem extends CartProduct {
  quantity: number;
}

interface CartContextValue {
  items: CartItem[];
  count: number;
  totalUsd: number;
  ready: boolean;
  add: (product: CartProduct, quantity?: number) => void;
  setQuantity: (id: string, quantity: number) => void;
  remove: (id: string) => void;
  clear: () => void;
}

const STORAGE_KEY = "maison-privee-cart-v1";
const CartContext = createContext<CartContextValue | null>(null);

function validStored(value: unknown): CartItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item) => item && typeof item.id === "string" && typeof item.name === "string")
    .map((item) => ({
      id: item.id,
      brand: String(item.brand || ""),
      name: String(item.name),
      finalPriceUsd: Number(item.finalPriceUsd || 0),
      imageSrc: String(item.imageSrc || ""),
      quantity: Math.min(10, Math.max(1, Number(item.quantity) || 1))
    }))
    .filter((item) => item.finalPriceUsd > 0)
    .slice(0, 30);
}

export default function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try { setItems(validStored(JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"))); } catch {}
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, ready]);

  const value = useMemo<CartContextValue>(() => ({
    items,
    count: items.reduce((sum, item) => sum + item.quantity, 0),
    totalUsd: items.reduce((sum, item) => sum + item.finalPriceUsd * item.quantity, 0),
    ready,
    add(product, quantity = 1) {
      setItems((current) => {
        const existing = current.find((item) => item.id === product.id);
        if (existing) {
          return current.map((item) => item.id === product.id
            ? { ...item, quantity: Math.min(10, item.quantity + quantity) }
            : item);
        }
        return [...current, { ...product, quantity: Math.min(10, Math.max(1, quantity)) }];
      });
    },
    setQuantity(id, quantity) {
      if (quantity <= 0) setItems((current) => current.filter((item) => item.id !== id));
      else setItems((current) => current.map((item) => item.id === id
        ? { ...item, quantity: Math.min(10, quantity) }
        : item));
    },
    remove(id) { setItems((current) => current.filter((item) => item.id !== id)); },
    clear() { setItems([]); }
  }), [items, ready]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error("useCart debe usarse dentro de CartProvider");
  return value;
}
