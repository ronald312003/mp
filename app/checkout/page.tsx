import type { Metadata } from "next";
import { getExchange } from "@/lib/data";
import CheckoutForm from "@/components/CheckoutForm";

export const metadata: Metadata = { title: "Confirmar pedido · Maison Privée" };

export default async function CheckoutPage() {
  const exchange = await getExchange();
  return <CheckoutForm rate={exchange.rate} />;
}
