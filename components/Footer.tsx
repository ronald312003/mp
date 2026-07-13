import Link from "next/link";

export default function Footer({ rate, source }: { rate: number; source: string }) {
  return (
    <footer className="mt-24 border-t border-line bg-surface2">
      <div className="container-shell py-14">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <p className="font-serif text-2xl text-content">Maison Privée</p>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted">
              Curaduría de relojes, moda y perfumería de diseñador bajo el código del lujo
              silencioso. Piezas que hablan bajo, pero se recuerdan.
            </p>
          </div>

          <div>
            <p className="eyebrow mb-4">Explorar</p>
            <ul className="space-y-2 text-sm text-muted">
              <li><Link href="/coleccion/lujo-silencioso" className="hover:text-content">Lujo Silencioso</Link></li>
              <li><Link href="/coleccion/elegante" className="hover:text-content">Elegante</Link></li>
              <li><Link href="/coleccion/noche" className="hover:text-content">Noche</Link></li>
              <li><Link href="/tienda" className="hover:text-content">Catálogo completo</Link></li>
            </ul>
          </div>

          <div>
            <p className="eyebrow mb-4">Tipo de cambio</p>
            <p className="text-sm text-muted">
              1 USD ≈ <span className="text-content">S/ {rate.toFixed(2)}</span>
            </p>
            <p className="mt-1 text-xs text-muted">
              Basado en el valor de venta de Kambista {source === "kambista" ? "(en vivo)" : "(referencial)"} + 0.10.
            </p>
          </div>
        </div>

        <div className="mt-12 flex flex-col justify-between gap-2 border-t border-line pt-6 text-xs text-muted sm:flex-row">
          <span>© {new Date().getFullYear()} Maison Privée. Todos los derechos reservados.</span>
          <span>Precios mostrados en USD y PEN.</span>
        </div>
      </div>
    </footer>
  );
}
