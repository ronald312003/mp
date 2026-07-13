import { loginAction } from "../actions";

export const metadata = { title: "Acceso administrador · Maison Privée" };

export default function AdminLogin({
  searchParams
}: {
  searchParams: { error?: string; next?: string };
}) {
  const hasError = searchParams.error === "1";
  const next = searchParams.next ?? "/admin";

  return (
    <div className="container-shell flex min-h-[70vh] items-center justify-center py-16">
      <div className="w-full max-w-sm rounded-xl border border-line bg-surface p-8 shadow-soft">
        <p className="eyebrow">Maison Privée</p>
        <h1 className="mt-2 font-serif text-3xl text-content">Acceso administrador</h1>
        <p className="mt-2 text-sm text-muted">
          Ingresa la contraseña para gestionar el catálogo.
        </p>

        {hasError && (
          <p className="mt-4 rounded-md border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm text-red-500">
            Contraseña incorrecta.
          </p>
        )}

        <form action={loginAction} className="mt-6 space-y-4">
          <input type="hidden" name="next" value={next} />
          <div>
            <label className="label" htmlFor="password">Contraseña</label>
            <input
              id="password"
              name="password"
              type="password"
              autoFocus
              required
              className="field"
              placeholder="••••••••"
            />
          </div>
          <button type="submit" className="btn-primary w-full">Entrar</button>
        </form>
      </div>
    </div>
  );
}
