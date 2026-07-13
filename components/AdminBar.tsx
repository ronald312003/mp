import Link from "next/link";
import { logoutAction } from "@/app/admin/actions";

export default function AdminBar() {
  return (
    <div className="border-b border-line bg-surface2">
      <div className="container-shell flex h-14 items-center justify-between gap-4">
        <Link href="/admin" className="font-serif text-lg text-content">
          Maison Privée <span className="text-muted">· Admin</span>
        </Link>
        <div className="flex items-center gap-3 text-[12px] uppercase tracking-[0.12em]">
          <Link href="/" className="text-muted hover:text-content">Ver sitio</Link>
          <Link href="/admin/products/new" className="btn-accent px-4 py-2">Nuevo producto</Link>
          <form action={logoutAction}>
            <button type="submit" className="text-muted hover:text-content">Salir</button>
          </form>
        </div>
      </div>
    </div>
  );
}
