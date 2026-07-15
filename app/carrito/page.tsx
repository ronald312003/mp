import type { Metadata } from "next";
import { getExchange } from "@/lib/data";
import CartPageClient from "@/components/CartPageClient";

export const metadata: Metadata = { title: "Bolsa de compra · Maison Privée" };

export default async function CartPage() {
  const exchange = await getExchange();
  return <CartPageClient rate={exchange.rate} />;
}
