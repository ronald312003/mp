// ============================================================
//  "Completa el look" con Gemini, contextualizado al CATÁLOGO REAL.
//
//  Para cada producto se preparan candidatos de OTRAS categorías del
//  propio catálogo y Gemini elige los 3 que mejor combinan, indica el
//  contexto (invierno, noche, oficina…) y redacta una nota elegante
//  en español explicando el porqué. Se guarda en el producto:
//    recoIds[]   -> ids de los productos recomendados
//    recoNote    -> explicación breve y elegante
//    recoContext -> slug de colección que ambienta la recomendación
//
//  Ejecutar directo (requiere GEMINI_API_KEY):
//    node scripts/gen-recos.mjs
// ============================================================

import "./load-env.mjs";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { geminiJSON, geminiEnabled } from "../lib/gemini.mjs";
import { buildSeedSql } from "./seed-sql.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CONTEXTS = [
  "lujo-silencioso", "elegante", "casual", "oficina",
  "noche", "verano", "invierno", "deportivo"
];

const loadJson = (p, fb = {}) => {
  try { return existsSync(p) ? JSON.parse(readFileSync(p, "utf8")) : fb; } catch { return fb; }
};
const saveJson = (p, data) => writeFileSync(p, JSON.stringify(data, null, 0), "utf8");

const matchGender = (a, b) => a === b || a === "unisex" || b === "unisex";

// Candidatos de OTRAS categorías: comparten colección y género compatible.
function candidatesFor(product, all, max = 22) {
  const set = new Set(product.collections);
  return all
    .filter((p) => p.id !== product.id && p.type !== product.type && matchGender(p.gender, product.gender))
    .map((p) => ({ p, overlap: p.collections.filter((c) => set.has(c)).length }))
    .sort((a, b) => b.overlap - a.overlap)
    .slice(0, max)
    .map(({ p }) => p);
}

const line = (p) =>
  `${p.id} | ${p.type} | ${p.brand} ${p.name.slice(0, 70)} | $${p.finalPriceUsd}`;

function buildPrompt(batch) {
  const blocks = batch
    .map(({ product, candidates }, i) => {
      return `### Producto ${i + 1}
PRINCIPAL: ${line(product)} | género:${product.gender} | estilos:${product.collections.join(",")}
CANDIDATOS (elige SOLO de esta lista, por id):
${candidates.map(line).join("\n")}`;
    })
    .join("\n\n");

  return `Eres el estilista de Maison Privée, una boutique de lujo silencioso en Lima, Perú (relojes, perfumes, ropa y calzado de diseñador).

Para CADA producto principal, elige exactamente 3 candidatos de SU lista (ids exactos) que completen mejor el look: cada uno de una categoría distinta si es posible, coherentes en género, estilo y ocasión. Indica también el contexto que mejor ambienta el conjunto (uno de: ${CONTEXTS.join(", ")}) y una nota en español, elegante y concreta (máx. 45 palabras), que explique por qué esas piezas combinan — menciona la ocasión o temporada y, si recomiendas un perfume, describe brevemente su carácter olfativo.

Responde SOLO JSON:
[{"id":"<id del principal>","picks":["id1","id2","id3"],"context":"<slug>","note":"<texto>"}]

${blocks}`;
}

/** Genera recomendaciones para products (muta recoIds/recoNote/recoContext). */
export async function generateRecos(products, cacheDir) {
  if (!geminiEnabled()) {
    console.log("  · (sin GEMINI_API_KEY: se usará el emparejado por reglas)");
    return;
  }
  mkdirSync(cacheDir, { recursive: true });
  const cachePath = resolve(cacheDir, "recos.json");
  const cache = loadJson(cachePath);
  const byId = new Map(products.map((p) => [p.id, p]));

  const validPicks = (product, ids = []) => {
    const seenTypes = new Set();
    return ids
      .map((id) => byId.get(id))
      .filter(
        (candidate) =>
          candidate &&
          candidate.id !== product.id &&
          candidate.type !== product.type &&
          matchGender(candidate.gender, product.gender)
      )
      .filter((candidate) => {
        if (seenTypes.has(candidate.type)) return false;
        seenTypes.add(candidate.type);
        return true;
      })
      .map((candidate) => candidate.id)
      .slice(0, 3);
  };

  // Un cambio de género o catálogo invalida recomendaciones cacheadas antiguas.
  for (const product of products) {
    if (!cache[product.id]) continue;
    const picks = validPicks(product, cache[product.id].picks);
    if (picks.length < Math.min(3, candidatesFor(product, products).length)) {
      delete cache[product.id];
    } else {
      cache[product.id].picks = picks;
    }
  }

  const pending = products.filter((p) => !cache[p.id]);
  console.log(`  · pendientes: ${pending.length}/${products.length}`);

  const BATCH = 8;
  for (let i = 0; i < pending.length; i += BATCH) {
    const slice = pending.slice(i, i + BATCH).map((product) => ({
      product,
      candidates: candidatesFor(product, products)
    }));
    const res = await geminiJSON(buildPrompt(slice));
    const arr = Array.isArray(res) ? res : res ? [res] : [];
    for (const r of arr) {
      if (!r?.id || !byId.has(r.id)) continue;
      const prod = byId.get(r.id);
      const candidates = slice.find((item) => item.product.id === prod.id)?.candidates || [];
      const allowed = new Set(candidates.map((candidate) => candidate.id));
      const requested = (r.picks || []).filter((id) => allowed.has(id));
      const picks = validPicks(prod, requested);
      for (const candidate of candidates) {
        if (picks.length >= 3) break;
        if (picks.includes(candidate.id)) continue;
        if (picks.some((id) => byId.get(id)?.type === candidate.type)) continue;
        picks.push(candidate.id);
      }
      if (!picks.length) continue;
      cache[r.id] = {
        picks,
        context: CONTEXTS.includes(r.context) ? r.context : prod.collections[0] || "elegante",
        note: typeof r.note === "string" ? r.note.trim().slice(0, 400) : null
      };
    }
    saveJson(cachePath, cache);
    process.stdout.write(`\r  · ${Math.min(i + BATCH, pending.length)}/${pending.length}   `);
  }
  if (pending.length) process.stdout.write("\n");

  let applied = 0;
  for (const p of products) {
    const r = cache[p.id];
    if (!r) continue;
    const picks = validPicks(p, r.picks || []);
    if (!picks.length) continue;
    p.recoIds = picks;
    p.recoNote = r.note || null;
    p.recoContext = r.context || null;
    applied++;
  }
  console.log(`  · recomendaciones aplicadas: ${applied}/${products.length}`);
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
    console.log("→ Recomendaciones con Gemini…");
    await generateRecos(catalog.products, resolve(ROOT, "scripts/.cache"));
    writeFileSync(catPath, JSON.stringify(catalog, null, 2), "utf8");
    console.log("✓ data/catalog.json");
    writeFileSync(resolve(ROOT, "db/seed.sql"), buildSeedSql(catalog), "utf8");
    console.log("✓ db/seed.sql");
  })().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
