// ============================================================
//  Imágenes editoriales generadas con Gemini (nano banana).
//
//  Toma la FOTO REAL del producto como referencia y genera una vista
//  profesional adicional SIN cambiar el producto:
//   - reloj   -> vista técnica editorial (componentes/detalle macro)
//   - ropa    -> modelo luciendo esa prenda exacta (estudio, lujo)
//   - zapatos -> puestos, encuadre editorial
//   - perfume -> bodegón de lujo del frasco exacto
//  Guarda en public/generated/<id>-ai.jpg y la añade a la galería.
//
//  Ejecutar (requiere GEMINI_API_KEY):
//    node scripts/gen-images-ai.mjs            (hasta GEMINI_IMG_LIMIT, def. 40)
//    GEMINI_IMG_LIMIT=200 node scripts/gen-images-ai.mjs
//  Re-ejecutar continúa donde quedó (cachea generados y fallidos).
// ============================================================

import "./load-env.mjs";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { geminiImage, geminiEnabled } from "../lib/gemini.mjs";
import { buildSeedSql } from "./seed-sql.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = resolve(ROOT, "public/generated");
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

const loadJson = (p, fb = {}) => {
  try { return existsSync(p) ? JSON.parse(readFileSync(p, "utf8")) : fb; } catch { return fb; }
};
const saveJson = (p, data) => writeFileSync(p, JSON.stringify(data, null, 0), "utf8");

const PROMPTS = {
  watch: (p) =>
    `Professional luxury watch editorial photograph of THIS EXACT watch (${p.brand} ${p.name}). Keep the dial, hands, bezel, colors and strap IDENTICAL to the reference image. Compose a refined technical presentation: the watch at a dramatic three-quarter angle on dark polished stone, with its strap/bracelet elegantly detached and arranged beside the case like a fine watchmaking exploded display. Soft studio lighting, subtle reflections, shallow depth of field. No text, no watermarks, no people.`,
  clothing: (p) =>
    `High-end fashion editorial photograph: a professional model wearing THIS EXACT garment (${p.brand} ${p.name}) from the reference image — keep fabric, color, print and cut identical. Quiet-luxury styling, neutral minimalist studio backdrop in warm cream tones, soft natural light, full-body composition. No text, no watermarks, no logos added.`,
  shoes: (p) =>
    `Luxury footwear editorial photograph of THIS EXACT pair (${p.brand} ${p.name}) — keep design, color and materials identical to the reference. Worn on feet, cropped elegant composition on a warm neutral studio set, soft directional light, shallow depth of field. No text, no watermarks.`,
  perfume: (p) =>
    `Luxury fragrance still-life photograph of THIS EXACT bottle (${p.brand} ${p.name}) — keep the bottle shape, label and liquid color identical to the reference. Editorial composition on silk and stone with soft golden light and gentle shadows, quiet-luxury aesthetic. No text, no watermarks.`
};

async function fetchAsBase64(url) {
  const r = await fetch(url, { headers: { "user-agent": UA }, signal: AbortSignal.timeout(15000) });
  if (!r.ok) throw new Error(`img ${r.status}`);
  const mime = (r.headers.get("content-type") || "image/jpeg").split(";")[0];
  const buf = Buffer.from(await r.arrayBuffer());
  if (buf.length > 4_000_000) throw new Error("imagen de referencia muy grande");
  return { mime, data: buf.toString("base64") };
}

/** Genera imágenes AI para hasta `limit` productos sin imagen generada. */
export async function generateAiImages(products, cacheDir, limit = 40) {
  if (!geminiEnabled()) {
    console.log("  · (sin GEMINI_API_KEY: se omite la generación de imágenes)");
    return 0;
  }
  mkdirSync(OUT_DIR, { recursive: true });
  mkdirSync(cacheDir, { recursive: true });
  const cachePath = resolve(cacheDir, "ai-images.json");
  const cache = loadJson(cachePath);

  // Adjuntar primero todo lo ya generado en corridas anteriores.
  for (const p of products) {
    const saved = Array.isArray(cache[p.id]) ? cache[p.id] : typeof cache[p.id] === "string" ? [cache[p.id]] : [];
    p.images = [...new Set([p.imageUrl, ...(p.images || []), ...saved].filter(Boolean))];
  }

  // Gemini es el último respaldo: solo trabaja galerías que siguen con menos
  // de tres vistas después de consultar las fuentes oficiales y la web.
  const order = { clothing: 0, shoes: 1, watch: 2, perfume: 3 };
  const targets = products
    .filter((p) => (p.images?.length || 0) < 3 && p.imageUrl && PROMPTS[p.type])
    .sort((a, b) => (order[a.type] ?? 9) - (order[b.type] ?? 9));

  let done = 0, failed = 0, quotaBlocked = false;
  for (const p of targets) {
    if (done >= limit) break;
    const saved = Array.isArray(cache[p.id]) ? cache[p.id] : typeof cache[p.id] === "string" ? [cache[p.id]] : [];
    try {
      const ref = await fetchAsBase64(p.imageUrl);
      while ((p.images?.length || 0) < 3 && done < limit) {
        const variant = saved.length + 1;
        const prompt = `${PROMPTS[p.type](p)} Create a clearly different camera angle and composition from the reference and previous views. Variant ${variant}.`;
        const img = await geminiImage(prompt, ref);
        if (!img) throw new Error("sin imagen en la respuesta");
        const ext = img.mime.includes("png") ? "png" : "jpg";
        const rel = `/generated/${p.id}-ai-${variant}.${ext}`;
        writeFileSync(resolve(ROOT, "public" + rel), img.buffer);
        saved.push(rel);
        p.images = [...new Set([...(p.images || []), rel])];
        cache[p.id] = saved;
        done++;
        saveJson(cachePath, cache);
        process.stdout.write(`\r  · generadas: ${done}/${limit}   `);
      }
    } catch (e) {
      cache[p.id] = saved;
      failed++;
      if (e?.code === "GEMINI_IMAGE_QUOTA") quotaBlocked = true;
      if (failed <= 3) console.warn(`\n  ! ${p.id}: ${e.message}`);
      if (quotaBlocked || (failed >= 8 && done === 0)) break;
    }
    saveJson(cachePath, cache);
  }
  if (done) process.stdout.write("\n");

  // Añadir a la galería (los ya generados en corridas anteriores también).
  let attached = 0;
  for (const p of products) {
    const saved = Array.isArray(cache[p.id]) ? cache[p.id] : typeof cache[p.id] === "string" ? [cache[p.id]] : [];
    for (const rel of saved) if (rel && existsSync(resolve(ROOT, "public" + rel))) {
      p.images = p.images || (p.imageUrl ? [p.imageUrl] : []);
      if (!p.images.includes(rel)) p.images.push(rel);
      attached++;
    }
  }
  console.log(`  · imágenes AI en galería: ${attached} (nuevas: ${done}, fallidas: ${failed})`);
  return done;
}

// ---------- ejecutable directo ----------
if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  (async () => {
    if (!geminiEnabled()) {
      console.error("Falta GEMINI_API_KEY en el entorno.");
      process.exit(1);
    }
    const catPath = resolve(ROOT, "data/catalog.json");
    const catalog = JSON.parse(readFileSync(catPath, "utf8"));
    const limit = Number(process.env.GEMINI_IMG_LIMIT || 40);
    console.log(`→ Generación de imágenes editoriales (límite ${limit})…`);
    await generateAiImages(catalog.products, resolve(ROOT, "scripts/.cache"), limit);
    writeFileSync(catPath, JSON.stringify(catalog, null, 2), "utf8");
    console.log("✓ data/catalog.json");
    writeFileSync(resolve(ROOT, "db/seed.sql"), buildSeedSql(catalog), "utf8");
    console.log("✓ db/seed.sql");
  })().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
