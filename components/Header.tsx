import Link from "next/link";
import ThemeToggle from "./ThemeToggle";
import CartIndicator from "./CartIndicator";

// Fila principal: qué vendemos. Fila secundaria: estilos y temporadas.
const PRIMARY = [
  { href: "/tienda?type=watch", label: "Relojes" },
  { href: "/tienda?type=perfume", label: "Perfumes" },
  { href: "/tienda?type=clothing", label: "Ropa" },
  { href: "/tienda?type=shoes", label: "Zapatos" },
  { href: "/casas", label: "Casas de moda" }
];

const SECONDARY = [
  { href: "/coleccion/lujo-silencioso", label: "Lujo Silencioso" },
  { href: "/coleccion/elegante", label: "Elegante" },
  { href: "/coleccion/casual", label: "Casual" },
  { href: "/coleccion/oficina", label: "Oficina" },
  { href: "/coleccion/noche", label: "Noche" },
  { href: "/coleccion/verano", label: "Verano" },
  { href: "/coleccion/invierno", label: "Invierno" },
  { href: "/coleccion/deportivo", label: "Deportivo" }
];

export default function Header({ rate }: { rate: number }) {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/90 backdrop-blur">
      <div className="container-shell">
        <div className="flex h-16 min-w-0 items-center justify-between gap-3 sm:h-[74px]">
          <Link href="/" className="min-w-0 shrink leading-none">
            <span className="block truncate font-serif text-xl font-semibold text-content min-[390px]:text-[1.4rem] sm:text-[1.65rem]">
              Maison Privée
            </span>
          </Link>

          <nav className="hidden items-center gap-7 lg:flex" aria-label="Categorías">
            {PRIMARY.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className="link-underline text-sm font-semibold text-muted transition hover:text-content"
              >
                {n.label}
              </Link>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2.5">
            <ThemeToggle />
            <CartIndicator />
            <Link
              href="/tienda"
              className="hidden rounded-editorial bg-inverse px-5 py-2.5 text-sm font-semibold text-inverse-fg transition hover:opacity-90 min-[430px]:inline-flex"
            >
              Tienda
            </Link>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 border-t border-line/60">
          <nav
            className="no-scrollbar flex min-w-0 gap-5 overflow-x-auto pb-3 pt-2.5 text-[13px] font-medium text-muted sm:gap-6"
            aria-label="Colecciones"
          >
            {SECONDARY.map((c) => (
              <Link key={c.href} href={c.href} className="nav-cat whitespace-nowrap">
                {c.label}
              </Link>
            ))}
          </nav>
          <span className="hidden shrink-0 rounded-full bg-surface2 px-3 py-1 text-[11px] font-semibold tracking-[0.08em] text-muted md:inline">
            1 USD ≈ S/ {rate.toFixed(2)}
          </span>
        </div>
      </div>
    </header>
  );
}
