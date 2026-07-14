import { getProduct } from "@/lib/data";

export const dynamic = "force-dynamic";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

// Proxy de imágenes: sirve las fotos del producto desde NUESTRO dominio,
// de modo que al inspeccionar la página el cliente nunca ve el origen
// real (la tienda proveedora queda interna).
//   /api/img/<id>        -> foto principal
//   /api/img/<id>?i=N    -> foto N de la galería (product.images[N])
// Las rutas locales (/generated/…) no pasan por aquí: Next las sirve directo.
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const product = await getProduct(params.id);
  if (!product || !product.imageUrl) {
    return new Response("Not found", { status: 404 });
  }

  const idx = Number(new URL(req.url).searchParams.get("i") || 0);
  const list = product.images?.length ? product.images : [product.imageUrl];
  let target = list[Number.isFinite(idx) ? idx : 0] ?? product.imageUrl;
  if (!target || target.startsWith("/")) target = product.imageUrl; // locales no se proxean

  const origin = (() => {
    try { return new URL(target).origin + "/"; } catch { return undefined; }
  })();

  // Intenta sin referer y, si falla, con referer del propio origen (algunos CDN
  // exigen referer para permitir el hotlink).
  async function grab(withReferer: boolean) {
    const headers: Record<string, string> = { "user-agent": UA, accept: "image/*,*/*" };
    if (withReferer && origin) headers.referer = origin;
    const r = await fetch(target, { headers, signal: AbortSignal.timeout(12000) });
    if (!r.ok || !r.body) throw new Error("upstream " + r.status);
    const ct = r.headers.get("content-type") || "image/jpeg";
    if (!ct.startsWith("image/")) throw new Error("no image");
    return { body: r.body, ct };
  }

  for (const withRef of [false, true]) {
    try {
      const { body, ct } = await grab(withRef);
      return new Response(body, {
        status: 200,
        headers: {
          "content-type": ct,
          "cache-control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400"
        }
      });
    } catch {
      /* intenta la siguiente variante */
    }
  }
  return new Response("Upstream error", { status: 502 });
}
