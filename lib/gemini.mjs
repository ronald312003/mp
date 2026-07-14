// ============================================================
//  Cliente mínimo de Gemini (Google).
//  - Texto con salida JSON (recomendaciones de estilo)
//  - Generación de imágenes (editoriales, con foto real de referencia)
//  La key se lee SOLO de la variable de entorno GEMINI_API_KEY y se
//  envía por header (nunca en la URL ni escrita en archivos).
//  Soporta keys de AI Studio ("AIza…") y de Vertex AI express ("AQ.…").
// ============================================================

const TEXT_MODELS = ["gemini-2.5-flash", "gemini-2.0-flash"];
const IMAGE_MODELS = ["gemini-2.5-flash-image", "gemini-2.5-flash-image-preview"];

const apiKey = () => process.env.GEMINI_API_KEY || "";
export function geminiEnabled() {
  return Boolean(apiKey());
}

// Vertex Express usa aiplatform; AI Studio usa generativelanguage. El formato
// de la clave determina el proveedor, evitando duplicar timeouts contra una API
// que no puede autenticar esa credencial.
function endpoints(model) {
  const gl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  const vx = `https://aiplatform.googleapis.com/v1/publishers/google/models/${model}:generateContent`;
  return apiKey().startsWith("AQ.") ? [vx] : [gl];
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
        const err = new Error(json?.error?.message || `HTTP ${res.status}`);
        err.status = res.status;
        throw err;
      }
      return json;
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr;
}

function textOf(json) {
  return (
    json?.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("") || ""
  );
}

/** Prompt → objeto JSON (o null si falla). */
export async function geminiJSON(prompt, { tries = 2 } = {}) {
  for (const model of TEXT_MODELS) {
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
        const authError = e.status === 401 || e.status === 403;
        if (authError || i === tries - 1) console.warn(`  ! gemini(${model}): ${e.message}`);
        if (authError) return null;
        await new Promise((r) => setTimeout(r, 1200 * (i + 1)));
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
      console.warn(`  ! gemini-image(${model}): ${e.message}`);
    }
  }
  return null;
}
