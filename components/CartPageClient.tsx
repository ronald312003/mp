"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "./CartProvider";

const money = (value: number, currency: "USD" | "PEN") =>
  new Intl.NumberFormat("es-PE", { style: "currency", currency }).format(value);

export default function CartPageClient({ rate }: { rate: number }) {
  const { items, totalUsd, setQuantity, remove, ready } = useCart();
  if (!ready) return <div className="mx-auto my-20 h-8 w-8 spinner" />;

  if (!items.length) {
    return (
      <section className="container-shell py-24 text-center">
        <p className="eyebrow">Tu selección</p>
        <h1 className="mt-4 font-serif text-5xl text-content">La bolsa está vacía.</h1>
        <p className="mx-auto mt-4 max-w-lg text-lg text-muted">
          Guarda las piezas que te interesan y finaliza el pedido con un resumen en PDF.
        </p>
        <Link href="/tienda" className="btn-accent mt-8">Explorar la selección</Link>
      </section>
    );
  }

  return (
    <div className="container-shell py-12 sm:py-16">
      <p className="eyebrow">Tu selección</p>
      <h1 className="mt-3 font-serif text-5xl text-content sm:text-6xl">Bolsa de compra</h1>
      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_360px] lg:items-start">
        <div className="space-y-4">
          {items.map((item) => (
            <article key={item.id} className="grid grid-cols-[104px_1fr] gap-4 rounded-[24px] border border-line bg-surface p-4 sm:grid-cols-[140px_1fr] sm:p-5">
              <Link href={`/producto/${item.id}`} className="relative aspect-square overflow-hidden rounded-2xl bg-surface2">
                <Image src={item.imageSrc} alt={`${item.brand} ${item.name}`} fill sizes="140px" className="object-contain p-3" />
              </Link>
              <div className="flex min-w-0 flex-col sm:flex-row sm:justify-between sm:gap-5">
                <div>
                  <p className="eyebrow">{item.brand}</p>
                  <Link href={`/producto/${item.id}`} className="mt-1 line-clamp-2 font-serif text-xl text-content hover:text-accent sm:text-2xl">{item.name}</Link>
                  <p className="mt-2 text-sm text-muted">{money(item.finalPriceUsd, "USD")} · {money(item.finalPriceUsd * rate, "PEN")}</p>
                </div>
                <div className="mt-4 flex items-center justify-between gap-3 sm:mt-0 sm:flex-col sm:items-end">
                  <div className="flex items-center rounded-full border border-line bg-bg p-1">
                    <button type="button" onClick={() => setQuantity(item.id, item.quantity - 1)} className="h-8 w-8 rounded-full text-lg text-content hover:bg-surface2" aria-label="Reducir cantidad">−</button>
                    <span className="w-8 text-center text-sm text-content">{item.quantity}</span>
                    <button type="button" onClick={() => setQuantity(item.id, item.quantity + 1)} className="h-8 w-8 rounded-full text-lg text-content hover:bg-surface2" aria-label="Aumentar cantidad">+</button>
                  </div>
                  <button type="button" onClick={() => remove(item.id)} className="text-sm text-muted underline-offset-4 hover:text-content hover:underline">Quitar</button>
                </div>
              </div>
            </article>
          ))}
        </div>

        <aside className="sticky top-36 rounded-[28px] border border-line bg-surface p-6 shadow-soft">
          <p className="eyebrow">Resumen</p>
          <div className="mt-5 space-y-3 border-b border-line pb-5 text-base">
            <div className="flex justify-between text-muted"><span>Productos</span><span>{money(totalUsd, "USD")}</span></div>
            <div className="flex justify-between text-muted"><span>Envío</span><span>Por confirmar</span></div>
          </div>
          <div className="flex items-end justify-between py-5">
            <span className="font-medium text-content">Total productos</span>
            <span className="text-right"><strong className="block font-serif text-3xl text-content">{money(totalUsd, "USD")}</strong><small className="text-muted">{money(totalUsd * rate, "PEN")}</small></span>
          </div>
          <Link href="/checkout" className="btn-accent w-full">Continuar al pedido</Link>
          <p className="mt-4 text-center text-xs leading-relaxed text-muted">Completarás tus datos, recibirás el PDF y confirmarás por WhatsApp.</p>
        </aside>
      </div>
    </div>
  );
}
