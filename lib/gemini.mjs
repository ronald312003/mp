// ============================================================
//  Cliente mínimo de Gemini (Google).
//  - Texto con salida JSON (recomendaciones de estilo)
//  - Generación de imágenes (editoriales, con foto real de referencia)
//  La key se lee SOLO de la variable de entorno GEMINI_API_KEY y se
//  envía por header (nunca en la URL ni escrita en archivos).
//  Soporta keys de AI Studio ("AIza…") y de Vertex AI express ("AQ.…").
// ============================================================

const modelList = (envName, fallback) =>
  (process.env[envName] || fallback).split(",").map((value) => value.trim()).filter(Boolean);

// Modelos estables/actuales primero. Las listas son configurables para poder
// migrar en Render sin editar código cuando Google cambie el ciclo de vida.
const TEXT_MODELS = modelList(
  "GEMINI_TEXT_MODELS",
  "gemini-3.5-flash,gemini-flash-latest,gemini-2.5-flash"
);
const IMAGE_MODELS = modelList(
  "GEMINI_IMAGE_MODELS",
  "gemini-3.1-flash-image,gemini-2.5-flash-image"
);

const apiKey = () => process.env.GEMINI_API_KEY || "";
export function geminiEnabled() {
  return Boolean(apiKey());
}

// AI Studio y Vertex Express pueden emitir claves con formatos distintos, pero
// el prefijo no identifica el proveedor de forma fiable. AI Studio es el valor
// por defecto; Vertex se puede seleccionar explícitamente en el entorno.
function endpoints(model) {
  const gl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  const vx = `https://aiplatform.googleapis.com/v1/publishers/google/models/${model}:generateContent`;
  return process.env.GEMINI_API_PROVIDER === "vertex" ? [vx] : [gl];
}

async function call(model, body, timeoutMs = 45000) {
  let lastErr;
  for (const url of endpoints(model)) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json", "x-goog-api-key": apiKey() },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(timeoutMs)
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = json?.error?.message || `HTTP ${res.status}`;
        const err = new Error(msg);
        err.status = res.status;
        if (res.status === 429) {
          // Cuota del nivel gratuito: Google indica cuánto esperar.
          const m = msg.match(/retry in ([\d.]+)s/i);
          err.retryAfter = m ? Math.ceil(parseFloat(m[1])) : 30;
        }
        throw err;
      }
      return json;
    } catch (e) {
      lastErr = e;
      if (e?.retryAfter) break; // es cuota, no conectividad: no probar otro endpoint
    }
  }
  throw lastErr;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function textOf(json) {
  return (
    json?.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("") || ""
  );
}

/** Prompt → objeto JSON (o null si falla). Respeta la cuota del nivel gratuito.
 *  maxQuotaWaits limita cuánto esperar por cuota antes de rendirse (el llamador
 *  puede entonces caer a otro proveedor, p. ej. OpenAI). */
export async function geminiJSON(prompt, { tries = 2, maxQuotaWaits = 8 } = {}) {
  for (const model of TEXT_MODELS) {
    let quotaWaits = 0;
    for (let i = 0; i < tries; i++) {
      try {
        const json = await call(model, {
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.4, responseMimeType: "application/json" }
        });
        const text = textOf(json);
        const m = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
        return JSON.parse(m ? m[0] : text);
      } catch (e) {
        if (e?.retryAfter && quotaWaits < maxQuotaWaits) {
          // Límite de peticiones/minuto: esperar lo que indica Google y reintentar.
          quotaWaits++;
          i--;
          const wait = Math.min(e.retryAfter + 2, 90);
          console.log(`  · cuota Gemini (${model}): esperando ${wait}s…`);
          await sleep(wait * 1000);
          continue;
        }
        if (e?.retryAfter) return null; // cuota agotada: que el llamador use su respaldo
        const authError = e.status === 401 || e.status === 403;
        if (authError || i === tries - 1) console.warn(`  ! gemini(${model}): ${e.message}`);
        if (authError) return null;
        await sleep(1200 * (i + 1));
      }
    }
  }
  return null;
}

/**
 * Genera una imagen. Si se pasa refImage ({mime, data base64}) el modelo
 * conserva el producto REAL de la foto (edición/escena, no invención).
 * Devuelve { mime, buffer } o null.
 */
export async function geminiImage(prompt, refImage = null) {
  const parts = [];
  if (refImage) parts.push({ inlineData: { mimeType: refImage.mime, data: refImage.data } });
  parts.push({ text: prompt });

  for (const model of IMAGE_MODELS) {
    try {
      const json = await call(
        model,
        {
          contents: [{ role: "user", parts }],
          generationConfig: { responseModalities: ["TEXT", "IMAGE"] }
        },
        120000
      );
      const part = json?.candidates?.[0]?.content?.parts?.find(
        (p) => p.inlineData?.data || p.inline_data?.data
      );
      const d = part?.inlineData || part?.inline_data;
      if (d?.data) {
        return { mime: d.mimeType || d.mime_type || "image/png", buffer: Buffer.from(d.data, "base64") };
      }
    } catch (e) {
      if (e?.status === 429) {
        const quotaError = new Error("Gemini Image no tiene cuota disponible para esta clave/proyecto.");
        quotaError.code = "GEMINI_IMAGE_QUOTA";
        throw quotaError;
      }
      console.warn(`  ! gemini-image(${model}): ${String(e.message).split("\n")[0]}`);
    }
  }
  return null;
}
