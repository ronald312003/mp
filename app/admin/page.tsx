import Link from "next/link";
import Image from "next/image";
import { getCatalog } from "@/lib/data";
import { hasDatabase } from "@/lib/db";
import { fmtUsd } from "@/lib/format";
import AdminBar from "@/components/AdminBar";
import { deleteProductAction } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Panel de administración · Maison Privée" };

const TYPE_LABEL: Record<string, string> = {
  watch: "Reloj",
  perfume: "Perfume",
  clothing: "Ropa",
  shoes: "Calzado"
};
const OK_LABEL: Record<string, string> = {
  creado: "Producto creado.",
  actualizado: "Producto actualizado.",
  eliminado: "Producto eliminado."
};

export default async function AdminHome({
  searchParams
}: {
  searchParams: { q?: string; ok?: string };
}) {
  const { products } = await getCatalog();
  const q = (searchParams.q ?? "").toLowerCase().trim();

  const filtered = q
    ? products.filter(
        (p) => p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q)
      )
    : products;
  const shown = filtered.slice(0, 200);

  return (
    <div>
      <AdminBar />
      <div className="container-shell py-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl text-content">Productos</h1>
            <p className="mt-1 text-sm text-muted">{products.length} en el catálogo</p>
          </div>
          <form className="flex gap-2">
            <input
              name="q"
              defaultValue={searchParams.q ?? ""}
              placeholder="Buscar por nombre o marca…"
              className="field w-64"
            />
            <button className="btn-ghost px-4 py-2">Buscar</button>
          </form>
        </div>

        {!hasDatabase() && (
          <p className="mb-6 rounded-md border border-amber-400/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-600">
            No hay <code>DATABASE_URL</code> configurada. Estás viendo el catálogo horneado (solo
            lectura). Para <strong>crear, editar o eliminar</strong> productos, conecta la base de
            datos de Neon en las variables de entorno.
          </p>
        )}

        {searchParams.ok && OK_LABEL[searchParams.ok] && (
          <p className="mb-6 rounded-md border border-emerald-400/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-600">
            {OK_LABEL[searchParams.ok]}
          </p>
        )}

        <div className="overflow-x-auto rounded-lg border border-line">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-surface2 text-left text-[11px] uppercase tracking-[0.12em] text-muted">
              <tr>
                <th className="px-4 py-3">Producto</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Base</th>
                <th className="px-4 py-3">Venta</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((p) => (
                <tr key={p.id} className="border-t border-line align-middle">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded bg-surface2">
                        <Image src={p.imageUrl} alt="" fill sizes="48px" className="object-contain p-1" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-content">{p.name}</p>
                        <p className="text-xs text-muted">{p.brand}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted">{TYPE_LABEL[p.type] ?? p.type}</td>
                  <td className="px-4 py-3 text-muted">{fmtUsd(p.basePriceUsd)}</td>
                  <td className="px-4 py-3 font-medium text-content">{fmtUsd(p.finalPriceUsd)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-3">
                      <Link
                        href={`/admin/products/${p.id}/edit`}
                        className="text-accent hover:underline"
                      >
                        Editar
                      </Link>
                      <form action={deleteProductAction}>
                        <input type="hidden" name="id" value={p.id} />
                        <button type="submit" className="text-red-500 hover:underline">
                          Eliminar
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length > shown.length && (
          <p className="mt-4 text-center text-sm text-muted">
            Mostrando {shown.length} de {filtered.length}. Refina la búsqueda para ver más.
          </p>
        )}
      </div>
    </div>
  );
}
