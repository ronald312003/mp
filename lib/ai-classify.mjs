// ============================================================
//  IA (gpt-5.4-mini): clasifica productos en colecciones Y
//  redacta una descripción corta, elegante y precisa que
//  atraiga al cliente (sobre el diseño o el origen).
//  Requiere OPENAI_API_KEY. Sin ella, el llamador usa reglas.
// ============================================================

const MODEL = process.env.OPENAI_MODEL || "gpt-5.4-mini";
const ENDPOINT = "https://api.openai.com/v1/chat/completions";

export const COLLECTION_SLUGS = [
  "lujo-silencioso", "elegante", "casual", "oficina", "noche", "verano", "invierno", "deportivo"
];

const GUIDE = `Colecciones (elige 1 a 3 por producto):
- lujo-silencioso: sobrio, sin logos gritones, calidad discreta y atemporal.
- elegante: refinado, para lucir.
- casual: día a día con estilo.
- oficina: business, formal de trabajo.
- noche: fiesta/gala, intenso.
- verano: ligero, fresco, claro.
- invierno: cálido, abrigado, amaderado/especiado.
- deportivo: activo, energético.`;

async function callModel(products) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;

  const list = products.map((p, i) => `${i}. [${p.type}] ${p.brand} — ${p.name}`).join("\n");

  const body = {
    model: MODEL,
    messages: [
      {
        role: "system",
        content:
          "Eres el estilista de una boutique peruana de lujo silencioso. Clasificas productos y redactas microcopys de venta. Español neutro, elegante, sin exageraciones ni datos inventados. Respondes SOLO JSON válido."
      },
      {
        role: "user",
        content:
          `${GUIDE}\n\nPara cada producto devuelve tres campos:\n- collections: 1 a 3 slugs exactos.\n- description: UNA frase (máx. 20 palabras), precisa y elegante, que resalte el diseño, carácter u origen y anime a comprar. Sin relleno ni "producto de calidad".\n- styling: UNA frase (máx. 22 palabras) que explique cómo COMPLEMENTAR esta pieza con otras categorías (reloj + perfume + ropa/calzado) para un look de lujo silencioso, mencionando estilos o tonos concretos.\n\nDevuelve JSON: {"items":[{"i":<indice>,"collections":[...],"description":"...","styling":"..."}, ...]}.\n\nProductos:\n${list}`
      }
    ],
    response_format: { type: "json_object" }
  };

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { authorization: "Bearer " + key, "content-type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(60000)
  });
  if (!res.ok) throw new Error("openai HTTP " + res.status);
  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error("respuesta vacía");
  const parsed = JSON.parse(content);
  const out = new Array(products.length).fill(null);
  for (const it of parsed.items || []) {
    const idx = Number(it.i);
    if (idx < 0 || idx >= products.length) continue;
    const cols = (it.collections || []).filter((c) => COLLECTION_SLUGS.includes(c)).slice(0, 3);
    const desc = typeof it.description === "string" ? it.description.trim().slice(0, 180) : "";
    const styling = typeof it.styling === "string" ? it.styling.trim().slice(0, 200) : "";
    out[idx] = { collections: cols, description: desc, styling };
  }
  return out;
}

export const aiEnabled = () => Boolean(process.env.OPENAI_API_KEY);

/** Clasifica + describe un producto. Devuelve {collections, description} o null. */
export async function classifyOne(product) {
  try {
    const res = await callModel([product]);
    return res?.[0] || null;
  } catch {
    return null;
  }
}

/**
 * Clasifica + describe en lotes. Devuelve array alineado por índice con
 * {collections, description} (o null).
 */
export async function classifyAll(products, onProgress) {
  const BATCH = 24;
  const result = new Array(products.length).fill(null);
  for (let i = 0; i < products.length; i += BATCH) {
    const slice = products.slice(i, i + BATCH);
    try {
      const cls = await callModel(slice);
      if (cls) for (let k = 0; k < slice.length; k++) result[i + k] = cls[k];
    } catch (e) {
      console.warn("  ! IA lote", i, e.message);
    }
    if (onProgress) onProgress(Math.min(i + BATCH, products.length), products.length);
  }
  return result;
}
