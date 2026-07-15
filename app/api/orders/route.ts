import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getCatalog } from "@/lib/data";
import { getSql } from "@/lib/db";

export const dynamic = "force-dynamic";

const text = (value: unknown, max: number) => String(value || "").trim().slice(0, max);
const productLabel = (brand: string, name: string) =>
  name.toLocaleLowerCase().startsWith(brand.toLocaleLowerCase()) ? name : `${brand} ${name}`;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const customer = {
      name: text(body.customer?.name, 120),
      phone: text(body.customer?.phone, 30),
      email: text(body.customer?.email, 160),
      address: text(body.customer?.address, 220),
      district: text(body.customer?.district, 100),
      city: text(body.customer?.city, 100) || "Lima",
      reference: text(body.customer?.reference, 220),
      notes: text(body.customer?.notes, 500)
    };
    if (!customer.name || !customer.phone || !customer.address || !customer.district) {
      return NextResponse.json({ error: "Completa nombre, teléfono, dirección y distrito." }, { status: 400 });
    }
    const phoneDigits = customer.phone.replace(/\D/g, "");
    if (customer.name.length < 2 || phoneDigits.length < 9 || phoneDigits.length > 15) {
      return NextResponse.json({ error: "Revisa el nombre y escribe un WhatsApp válido con código de país." }, { status: 400 });
    }
    if (customer.address.length < 5 || customer.district.length < 2 || customer.city.length < 2) {
      return NextResponse.json({ error: "Completa una dirección, distrito y ciudad válidos." }, { status: 400 });
    }
    if (customer.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) {
      return NextResponse.json({ error: "El correo electrónico no tiene un formato válido." }, { status: 400 });
    }

    const requested = Array.isArray(body.items) ? body.items.slice(0, 30) : [];
    const { products, exchange } = await getCatalog();
    const byId = new Map(products.map((product) => [product.id, product]));
    const items = requested.map((item: { id?: unknown; quantity?: unknown }) => {
      const product = byId.get(text(item.id, 80));
      const quantity = Math.min(10, Math.max(1, Number(item.quantity) || 1));
      return product ? {
        id: product.id,
        name: product.name,
        brand: product.brand,
        quantity,
        unitPriceUsd: product.finalPriceUsd,
        lineUsd: Math.round(product.finalPriceUsd * quantity * 100) / 100
      } : null;
    }).filter(Boolean) as Array<{ id: string; name: string; brand: string; quantity: number; unitPriceUsd: number; lineUsd: number }>;
    if (!items.length) return NextResponse.json({ error: "La bolsa está vacía o los productos ya no están disponibles." }, { status: 400 });

    const whatsapp = String(process.env.WHATSAPP_NUMBER || "").replace(/\D/g, "");
    if (!whatsapp) {
      return NextResponse.json({ error: "Falta configurar WHATSAPP_NUMBER en Render." }, { status: 503 });
    }

    const totalUsd = Math.round(items.reduce((sum, item) => sum + item.lineUsd, 0) * 100) / 100;
    const totalPen = Math.round(totalUsd * exchange.rate * 100) / 100;
    const orderId = `MP-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${randomUUID().slice(0, 8).toUpperCase()}`;
    const sql = getSql();
    if (sql) {
      await sql.transaction((tx) => [
        tx`INSERT INTO orders (
          id, status, customer_name, customer_phone, customer_email, address,
          district, city, reference, notes, exchange_rate, total_usd, total_pen
        ) VALUES (
          ${orderId}, 'whatsapp_pending', ${customer.name}, ${customer.phone}, ${customer.email || null},
          ${customer.address}, ${customer.district}, ${customer.city}, ${customer.reference || null},
          ${customer.notes || null}, ${exchange.rate}, ${totalUsd}, ${totalPen}
        )`,
        ...items.map((item, index) => tx`INSERT INTO order_items (
          order_id, line_no, product_id, product_name, brand, quantity, unit_price_usd
        ) VALUES (
          ${orderId}, ${index + 1}, ${item.id}, ${item.name}, ${item.brand}, ${item.quantity}, ${item.unitPriceUsd}
        )`)
      ]);
    }

    const lines = items.map((item) => `• ${item.quantity}x ${productLabel(item.brand, item.name)} — $${item.lineUsd.toFixed(2)}`);
    const message = [
      `Hola, deseo confirmar el pedido ${orderId}.`,
      "",
      ...lines,
      "",
      `Total productos: $${totalUsd.toFixed(2)} / S/ ${totalPen.toFixed(2)}`,
      `Cliente: ${customer.name}`,
      `Entrega: ${customer.address}, ${customer.district}, ${customer.city}`,
      customer.reference ? `Referencia: ${customer.reference}` : "",
      customer.notes ? `Nota: ${customer.notes}` : "",
      "",
      `El PDF ${orderId}.pdf ya fue descargado; lo adjuntaré en este chat para confirmar.`
    ].filter(Boolean).join("\n");

    return NextResponse.json({
      order: { id: orderId, customer, items, rate: exchange.rate, totalUsd, totalPen, createdAt: new Date().toISOString() },
      whatsappUrl: `https://wa.me/${whatsapp}?text=${encodeURIComponent(message)}`,
      persisted: Boolean(sql)
    });
  } catch (error) {
    console.error("order", error);
    return NextResponse.json({ error: "No fue posible registrar el pedido. Inténtalo nuevamente." }, { status: 500 });
  }
}
