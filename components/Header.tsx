import Link from "next/link";
import ThemeToggle from "./ThemeToggle";
import CartIndicator from "./CartIndicator";
import SearchButton from "./SearchButton";

// Una sola fila limpia: categorías + "Ocasiones" desplegable (la antigua fila
// superior de colecciones ahora vive oculta tras este selector), búsqueda
// global, tema y bolsa.
const PRIMARY = [
  { href: "/tienda?type=watch", label: "Relojes" },
  { href: "/tienda?type=perfume", label: "Perfumes" },
  { href: "/tienda?type=clothing", label: "Ropa" },
  { href: "/tienda?type=shoes", label: "Zapatos" },
  { href: "/casas", label: "Casas" }
];

const OCCASIONS = [
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
    <header className="glass-bar sticky top-0 z-40">
      <div className="container-shell">
        <div className="flex h-16 min-w-0 items-center justify-between gap-3 sm:h-[76px]">
          <Link href="/" className="min-w-0 shrink leading-none">
            <span className="block truncate font-serif text-xl font-semibold text-content min-[390px]:text-[1.4rem] sm:text-[1.65rem]">
              Maison Privée
            </span>
          </Link>

          <nav className="hidden items-center gap-6 lg:flex" aria-label="Categorías">
            {PRIMARY.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className="link-underline text-sm font-semibold text-muted transition-colors duration-200 hover:text-content"
              >
                {n.label}
              </Link>
            ))}
            {/* Ocasiones: desplegable liquid glass (reemplaza la fila superior) */}
            <details className="group relative">
              <summary className="flex cursor-pointer list-none items-center gap-1.5 text-sm font-semibold text-muted transition-colors duration-200 hover:text-content marker:hidden">
                Ocasiones
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.6" className="transition-transform duration-200 ease-out group-open:rotate-180" aria-hidden>
                  <path d="m2 3.5 3 3 3-3" />
                </svg>
              </summary>
              <div className="liquid-glass dropdown-pop absolute left-1/2 top-full z-30 mt-3 w-56 -translate-x-1/2 rounded-2xl p-2">
                {OCCASIONS.map((occasion, index) => (
                  <Link
                    key={occasion.href}
                    href={occasion.href}
                    className="search-item block rounded-xl px-3.5 py-2.5 text-sm font-medium text-content transition-colors duration-150 hover:bg-surface2"
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    {occasion.label}
                  </Link>
                ))}
                <p className="border-t border-line/60 px-3.5 pb-1 pt-2 text-[10px] text-muted">
                  1 USD ≈ S/ {rate.toFixed(2)}
                </p>
              </div>
            </details>
          </nav>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2.5">
            <SearchButton />
            <ThemeToggle />
            <CartIndicator />
            <Link
              href="/tienda"
              className="hidden rounded-editorial bg-inverse px-5 py-2.5 text-sm font-semibold text-inverse-fg transition-opacity duration-200 hover:opacity-90 min-[430px]:inline-flex"
            >
              Tienda
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
