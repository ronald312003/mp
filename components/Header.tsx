import Link from "next/link";
import ThemeToggle from "./ThemeToggle";

const NAV = [
  { href: "/coleccion/lujo-silencioso", label: "Lujo Silencioso" },
  { href: "/casas", label: "Casas" },
  { href: "/coleccion/elegante", label: "Elegante" },
  { href: "/coleccion/casual", label: "Casual" },
  { href: "/coleccion/oficina", label: "Oficina" },
  { href: "/coleccion/noche", label: "Noche" }
];

export default function Header({ rate }: { rate: number }) {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/85 backdrop-blur">
      <div className="container-shell">
        <div className="flex h-20 items-center justify-between gap-4">
          <Link href="/" className="flex flex-col leading-none">
            <span className="font-serif text-3xl tracking-wide text-content">Maison Privée</span>
            <span className="eyebrow mt-0.5">Quiet Luxury · Lima</span>
          </Link>

          <nav className="hidden items-center gap-6 lg:flex">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className="link-underline text-sm font-medium text-muted hover:text-content"
              >
                {n.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <span className="hidden text-[11px] uppercase tracking-[0.14em] text-muted sm:inline">
              1 USD ≈ S/ {rate.toFixed(2)}
            </span>
            <ThemeToggle />
            <Link
              href="/tienda"
              className="rounded-editorial border border-content px-4 py-2 text-sm font-semibold text-content transition hover:bg-inverse hover:text-inverse-fg"
            >
              Ver todo
            </Link>
          </div>
        </div>

        <div className="no-scrollbar flex gap-7 overflow-x-auto pb-3 text-sm font-medium text-muted">
          {[
            { href: "/casas", label: "Casas de moda" },
            { href: "/tienda?type=watch", label: "Relojes" },
            { href: "/tienda?type=perfume", label: "Perfumes" },
            { href: "/tienda?type=clothing", label: "Ropa" },
            { href: "/tienda?type=shoes", label: "Zapatos" },
            { href: "/coleccion/verano", label: "Verano" },
            { href: "/coleccion/invierno", label: "Invierno" },
            { href: "/coleccion/deportivo", label: "Deportivo" }
          ].map((c) => (
            <Link key={c.href} href={c.href} className="nav-cat whitespace-nowrap">
              {c.label}
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
}
