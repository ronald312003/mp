import { getProduct } from "@/lib/data";
import { canonicalProductImages } from "@/lib/product-images";

export const dynamic = "force-dynamic";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

function fallbackSvg(label: string) {
  const safe = label.replace(/[<>&"']/g, "").slice(0, 48);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 1200" role="img" aria-label="Imagen temporalmente no disponible">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#f8f1e8"/><stop offset="1" stop-color="#e7d7c4"/></linearGradient></defs>
    <rect width="1200" height="1200" fill="url(#g)"/>
    <circle cx="600" cy="530" r="170" fill="none" stroke="#b18960" stroke-width="3" opacity=".45"/>
    <path d="M505 530h190M600 435v190" stroke="#b18960" stroke-width="3" opacity=".45"/>
    <text x="600" y="780" text-anchor="middle" fill="#5d4532" font-family="Georgia,serif" font-size="42">${safe || "Maison Privée"}</text>
    <text x="600" y="835" text-anchor="middle" fill="#806a57" font-family="Arial,sans-serif" font-size="22" letter-spacing="5">IMAGEN EN ACTUALIZACIÓN</text>
  </svg>`;
}

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
  const list = canonicalProductImages(product);

  // Si el índice solicitado es válido, úsalo. Si no, intenta el siguiente.
  const startIdx = Number.isFinite(idx) && idx >= 0 ? idx : 0;
  const candidates = list
    .slice(startIdx)
    .concat(list.slice(0, startIdx))
    .filter((url): url is string => Boolean(url) && !String(url).startsWith("/"))
    .slice(0, 10);

  // Intenta sin referer y, si falla, con referer del propio origen (algunos CDN
  // exigen referer para permitir el hotlink).
  async function grab(target: string, withReferer: boolean) {
    const origin = (() => {
      try { return new URL(target).origin + "/"; } catch { return undefined; }
    })();
    const headers: Record<string, string> = { "user-agent": UA, accept: "image/*,*/*" };
    if (withReferer && origin) headers.referer = origin;
    const r = await fetch(target, { headers, signal: AbortSignal.timeout(7000) });
    if (!r.ok || !r.body) throw new Error("upstream " + r.status);
    const ct = r.headers.get("content-type") || "image/jpeg";
    if (!ct.startsWith("image/")) throw new Error("no image");
    return { body: r.body, ct };
  }

  for (const target of candidates) {
    for (const withRef of [false, true]) {
      try {
        const { body, ct } = await grab(target, withRef);
        return new Response(body, {
          status: 200,
          headers: {
            "content-type": ct,
            "cache-control": "public, max-age=86400, s-maxage=31536000, immutable"
          }
        });
      } catch {
        /* prueba el mismo CDN con referer y luego otra toma exacta */
      }
    }
  }

  // Evita un cuadro roto si un proveedor deja de servir temporalmente su CDN.
  // El status 200 permite que next/image lo pinte; el cache corto fuerza reintento.
  return new Response(fallbackSvg(product.brand), {
    status: 200,
    headers: {
      "content-type": "image/svg+xml; charset=utf-8",
      "cache-control": "public, max-age=300, s-maxage=900"
    }
  });
}
