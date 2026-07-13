import type { Product } from "@/lib/types";

const TYPES = [
  { v: "watch", l: "Reloj" },
  { v: "perfume", l: "Perfume" },
  { v: "clothing", l: "Ropa" },
  { v: "shoes", l: "Calzado" }
];
const GENDERS = [
  { v: "men", l: "Hombre" },
  { v: "women", l: "Mujer" },
  { v: "unisex", l: "Unisex" }
];
const COLLECTIONS = [
  { slug: "lujo-silencioso", label: "Lujo Silencioso" },
  { slug: "elegante", label: "Elegante" },
  { slug: "casual", label: "Casual" },
  { slug: "oficina", label: "Oficina" },
  { slug: "noche", label: "Noche" },
  { slug: "verano", label: "Verano" },
  { slug: "invierno", label: "Invierno" },
  { slug: "deportivo", label: "Deportivo" }
];

export default function ProductForm({
  action,
  defaults,
  submitLabel,
  error
}: {
  action: (formData: FormData) => void | Promise<void>;
  defaults?: Partial<Product>;
  submitLabel: string;
  error?: string;
}) {
  const d = defaults ?? {};
  const selected = new Set(d.collections ?? []);

  return (
    <form action={action} className="space-y-6">
      {error && (
        <p className="rounded-md border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm text-red-500">
          {error}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="brand">Marca</label>
          <input id="brand" name="brand" className="field" defaultValue={d.brand ?? ""} required />
        </div>
        <div>
          <label className="label" htmlFor="name">Nombre</label>
          <input id="name" name="name" className="field" defaultValue={d.name ?? ""} required />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="label" htmlFor="type">Tipo</label>
          <select id="type" name="type" className="field" defaultValue={d.type ?? "watch"}>
            {TYPES.map((t) => (
              <option key={t.v} value={t.v}>{t.l}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="gender">Género</label>
          <select id="gender" name="gender" className="field" defaultValue={d.gender ?? "unisex"}>
            {GENDERS.map((g) => (
              <option key={g.v} value={g.v}>{g.l}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="basePriceUsd">Precio base (USD)</label>
          <input
            id="basePriceUsd"
            name="basePriceUsd"
            type="number"
            step="0.01"
            min="0"
            className="field"
            defaultValue={d.basePriceUsd ?? ""}
            required
          />
          <p className="mt-1 text-xs text-muted">
            El precio de venta se calcula solo (base + markup).
          </p>
        </div>
      </div>

      <div className="rounded-md border border-line bg-surface2 p-4">
        <label className="label" htmlFor="priceOverrideUsd">
          Precio de venta mostrado (override, opcional)
        </label>
        <input
          id="priceOverrideUsd"
          name="priceOverrideUsd"
          type="number"
          step="0.01"
          min="0"
          className="field"
          defaultValue={d.priceOverrideUsd ?? ""}
          placeholder="Déjalo vacío para usar el precio calculado"
        />
        <p className="mt-1 text-xs text-muted">
          Si defines un valor aquí, será el precio que verá el cliente (en USD y su equivalente en
          soles), ignorando el cálculo automático. Útil para fijar el precio real de una prenda.
        </p>
      </div>

      <div>
        <label className="label" htmlFor="imageUrl">URL de imagen (opcional)</label>
        <input id="imageUrl" name="imageUrl" className="field" defaultValue={d.imageUrl ?? ""} placeholder="https://… (déjalo vacío para buscarla automáticamente)" />
        <p className="mt-1 text-xs text-muted">
          Si lo dejas vacío, se buscará automáticamente una imagen real del producto en internet.
        </p>
      </div>

      <div>
        <label className="label" htmlFor="sourceUrl">Enlace de compra interno (opcional, privado)</label>
        <input id="sourceUrl" name="sourceUrl" className="field" defaultValue={d.sourceUrl ?? ""} placeholder="https://… (solo lo ves tú, nunca se muestra al cliente)" />
      </div>

      <div>
        <label className="label" htmlFor="description">Descripción (opcional)</label>
        <textarea
          id="description"
          name="description"
          rows={3}
          className="field"
          defaultValue={d.description ?? ""}
        />
      </div>

      <div>
        <span className="label">Colecciones (outfits / estilos) — si lo dejas vacío, la IA clasifica</span>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {COLLECTIONS.map((c) => (
            <label
              key={c.slug}
              className="flex cursor-pointer items-center gap-2 rounded-md border border-line bg-surface px-3 py-2 text-sm text-content"
            >
              <input
                type="checkbox"
                name={`col_${c.slug}`}
                defaultChecked={selected.has(c.slug)}
                className="h-4 w-4 accent-current"
              />
              {c.label}
            </label>
          ))}
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button type="submit" className="btn-primary">{submitLabel}</button>
        <a href="/admin" className="btn-ghost">Cancelar</a>
      </div>
    </form>
  );
}
