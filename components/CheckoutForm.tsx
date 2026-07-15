"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import SmartImage from "./SmartImage";
import { useCart } from "./CartProvider";

type Receipt = {
  id: string;
  customer: { name: string; phone: string; email: string; address: string; district: string; city: string; reference: string; notes: string };
  items: Array<{ brand: string; name: string; quantity: number; unitPriceUsd: number; lineUsd: number }>;
  rate: number;
  totalUsd: number;
  totalPen: number;
  createdAt: string;
};

const productLabel = (brand: string, name: string) =>
  name.toLocaleLowerCase().startsWith(brand.toLocaleLowerCase()) ? name : `${brand} — ${name}`;

async function buildReceiptPdf(order: Receipt) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const left = 18;
  let y = 20;
  doc.setTextColor(35, 27, 21);
  doc.setFont("times", "bold");
  doc.setFontSize(24);
  doc.text("Maison Privée", left, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(120, 96, 76);
  doc.text("RESUMEN DE PEDIDO · ATENCIÓN POR WHATSAPP", left, y + 7);
  doc.setDrawColor(198, 163, 106);
  doc.line(left, y + 12, 192, y + 12);
  y += 24;

  doc.setTextColor(35, 27, 21);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(`Pedido ${order.id}`, left, y);
  doc.setFont("helvetica", "normal");
  doc.text(new Date(order.createdAt).toLocaleString("es-PE"), 192, y, { align: "right" });
  y += 10;
  const customerLines = [
    `Cliente: ${order.customer.name}`,
    `Teléfono: ${order.customer.phone}${order.customer.email ? ` · ${order.customer.email}` : ""}`,
    `Dirección: ${order.customer.address}, ${order.customer.district}, ${order.customer.city}`,
    order.customer.reference ? `Referencia: ${order.customer.reference}` : "",
    order.customer.notes ? `Notas: ${order.customer.notes}` : ""
  ].filter(Boolean);
  doc.setFontSize(10);
  for (const line of customerLines) {
    const wrapped = doc.splitTextToSize(line, 174);
    doc.text(wrapped, left, y);
    y += wrapped.length * 5;
  }
  y += 5;

  doc.setFillColor(245, 240, 234);
  doc.roundedRect(left, y, 174, 9, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.text("PIEZA", left + 3, y + 6);
  doc.text("CANT.", 145, y + 6, { align: "right" });
  doc.text("TOTAL", 189, y + 6, { align: "right" });
  y += 15;
  doc.setFont("helvetica", "normal");
  for (const item of order.items) {
    const title = productLabel(item.brand, item.name);
    const wrapped = doc.splitTextToSize(title, 112);
    doc.text(wrapped, left + 3, y);
    doc.text(String(item.quantity), 145, y, { align: "right" });
    doc.text(`$${item.lineUsd.toFixed(2)}`, 189, y, { align: "right" });
    y += Math.max(8, wrapped.length * 5 + 3);
    doc.setDrawColor(230, 220, 210);
    doc.line(left, y - 3, 192, y - 3);
    if (y > 260) { doc.addPage(); y = 20; }
  }
  y += 5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(`Total: $${order.totalUsd.toFixed(2)}`, 192, y, { align: "right" });
  doc.setFontSize(11);
  doc.text(`S/ ${order.totalPen.toFixed(2)} (tipo de cambio ${order.rate.toFixed(2)})`, 192, y + 7, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(120, 96, 76);
  doc.text("El costo y plazo de envío se confirman por WhatsApp. Este documento resume una solicitud de pedido.", left, 282);
  return doc.output("blob");
}

async function downloadReceiptPdf(order: Receipt) {
  const blob = await buildReceiptPdf(order);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${order.id}.pdf`;
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  // Safari móvil necesita que el blob siga disponible mientras entrega
  // la descarga al sistema; revocarlo inmediatamente la interrumpe.
  window.setTimeout(() => URL.revokeObjectURL(url), 15000);
}

export default function CheckoutForm({ rate }: { rate: number }) {
  const { items, totalUsd, ready, clear } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const customer = Object.fromEntries(["name", "phone", "email", "address", "district", "city", "reference", "notes"].map((key) => [key, String(form.get(key) || "").trim()]));
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ customer, items: items.map((item) => ({ id: item.id, quantity: item.quantity })) })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "No fue posible registrar el pedido.");
      await downloadReceiptPdf(result.order);
      clear();
      // Da tiempo real a Android/iOS para iniciar la descarga antes de que
      // el navegador entregue el control a la aplicación de WhatsApp.
      window.setTimeout(() => window.location.assign(result.whatsappUrl), 1200);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Ocurrió un error inesperado.");
      setLoading(false);
    }
  }

  if (!ready) return <div className="mx-auto my-20 spinner" />;
  if (!items.length) return (
    <section className="container-shell py-24 text-center">
      <h1 className="font-serif text-5xl text-content">No hay piezas para confirmar.</h1>
      <Link href="/tienda" className="btn-accent mt-8">Volver a la tienda</Link>
    </section>
  );

  return (
    <div className="container-shell py-12 sm:py-16">
      <nav aria-label="Progreso del pedido" className="mb-8 flex items-center gap-2 text-sm">
        <Link href="/carrito" className="text-muted transition hover:text-content">Bolsa</Link>
        <span className="text-muted/50">›</span>
        <span className="font-medium text-content">Datos de entrega</span>
        <span className="text-muted/50">›</span>
        <span className="text-muted">Confirmación por WhatsApp</span>
      </nav>
      <p className="eyebrow">Confirmación de pedido</p>
      <h1 className="mt-3 max-w-3xl font-serif text-[2.6rem] leading-none text-content sm:text-6xl">Completa tu información de entrega.</h1>
      <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">Revisaremos tu pedido, confirmaremos el envío por WhatsApp y te enviaremos un PDF con el resumen completo.</p>

      <form onSubmit={submit} className="mt-10 grid gap-8 lg:grid-cols-[1fr_380px] lg:items-start">
        <div className="rounded-[28px] border border-line bg-surface p-6 shadow-soft sm:p-8">
          <h2 className="font-serif text-3xl text-content">Contacto y entrega</h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <label className="sm:col-span-2">
              <span className="label">Nombre completo *</span>
              <input name="name" required minLength={2} maxLength={120} autoComplete="name" className="field" placeholder="Tu nombre aquí" />
            </label>
            <label>
              <span className="label">WhatsApp *</span>
              <input name="phone" required minLength={9} maxLength={30} inputMode="tel" autoComplete="tel" className="field" placeholder="+51 999 999 999" title="Incluye código de país (ej: +51 para Perú)" />
            </label>
            <label>
              <span className="label">Correo (opcional)</span>
              <input name="email" type="email" maxLength={160} autoComplete="email" className="field" placeholder="tu@email.com" />
            </label>
            <label className="sm:col-span-2">
              <span className="label">Dirección completa *</span>
              <input name="address" required minLength={5} maxLength={220} autoComplete="street-address" className="field" placeholder="Av. Ejemplo 123, Dpto. 456" />
            </label>
            <label>
              <span className="label">Distrito *</span>
              <input name="district" required minLength={2} maxLength={100} autoComplete="address-level3" className="field" placeholder="Ej: Miraflores" />
            </label>
            <label>
              <span className="label">Ciudad *</span>
              <input name="city" required minLength={2} maxLength={100} autoComplete="address-level2" defaultValue="Lima" className="field" />
            </label>
            <label className="sm:col-span-2">
              <span className="label">Referencia (opcional)</span>
              <input name="reference" maxLength={220} className="field" placeholder="Portería, color de puerta, indicaciones adicionales" />
            </label>
            <label className="sm:col-span-2">
              <span className="label">Notas del pedido (opcional)</span>
              <textarea name="notes" maxLength={500} rows={4} className="field resize-none" placeholder="Talla, horario preferido, comentarios especiales" />
            </label>
          </div>
        </div>

        <aside className="rounded-[28px] border border-line bg-surface p-6 shadow-soft lg:sticky lg:top-36">
          <p className="eyebrow">{items.length} {items.length === 1 ? "pieza" : "piezas"}</p>
          <div className="mt-5 max-h-72 space-y-3 overflow-y-auto pr-1">
            {items.map((item) => (
              <div key={item.id} className="flex gap-3 rounded-lg bg-surface2 p-3">
                <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-bg">
                  <SmartImage src={item.imageSrc} alt={`${item.brand} ${item.name}`} fill sizes="64px" className="object-contain p-1.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted uppercase tracking-wide">{item.brand}</p>
                  <p className="line-clamp-1 text-sm font-medium text-content">{item.name}</p>
                  <p className="mt-1 text-xs text-muted">{item.quantity}x ${item.finalPriceUsd.toFixed(2)}</p>
                </div>
                <span className="shrink-0 text-right text-sm font-semibold text-content">${(item.finalPriceUsd * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="mt-5 border-t border-line pt-5 text-right">
            <strong className="block font-serif text-4xl text-content">${totalUsd.toFixed(2)}</strong>
            <span className="text-sm text-muted">S/ {(totalUsd * rate).toFixed(2)} · envío por confirmar</span>
          </div>
          {error && <p role="alert" className="mt-4 rounded-2xl bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-300">{error}</p>}
          <button disabled={loading} type="submit" className="btn-accent mt-6 w-full disabled:cursor-wait disabled:opacity-60">
            {loading ? "Descargando PDF y abriendo WhatsApp…" : "Realizar pedido por WhatsApp"}
          </button>
          <p className="mt-4 text-xs leading-relaxed text-muted">WhatsApp no permite que una web adjunte archivos automáticamente: el PDF quedará descargado para que lo agregues al chat. Tus datos se usan solo para gestionar esta solicitud.</p>
        </aside>
      </form>
    </div>
  );
}
