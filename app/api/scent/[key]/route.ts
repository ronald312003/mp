import { SCENT_SOURCES } from "@/lib/style-visuals";

export const dynamic = "force-dynamic";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

// Proxy de imágenes de NOTAS OLFATIVAS (mapa fijo: no acepta URLs arbitrarias).
// Evita bloqueos de hotlink del CDN de origen y cachea agresivamente.
export async function GET(_req: Request, { params }: { params: { key: string } }) {
  const target = SCENT_SOURCES[params.key];
  if (!target) return new Response("Not found", { status: 404 });

  try {
    const r = await fetch(target, {
      headers: { "user-agent": UA, accept: "image/*,*/*" },
      signal: AbortSignal.timeout(12000)
    });
    const ct = r.headers.get("content-type") || "image/jpeg";
    if (!r.ok || !r.body || !ct.startsWith("image/")) throw new Error("upstream");
    return new Response(r.body, {
      status: 200,
      headers: {
        "content-type": ct,
        "cache-control": "public, max-age=604800, s-maxage=2592000, stale-while-revalidate=604800"
      }
    });
  } catch {
    return new Response("Upstream error", { status: 502 });
  }
}
