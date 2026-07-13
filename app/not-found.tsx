import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-shell flex min-h-[60vh] flex-col items-center justify-center text-center">
      <p className="eyebrow">Error 404</p>
      <h1 className="mt-3 font-serif text-5xl text-content">Página no encontrada</h1>
      <p className="mt-3 max-w-md text-sm text-muted">
        La pieza que buscas ya no está disponible o el enlace es incorrecto.
      </p>
      <Link href="/" className="btn-primary mt-8">
        Volver al inicio
      </Link>
    </div>
  );
}
