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
import { openaiJSON, aiEnabled as openaiEnabled } from "../lib/ai-classify.mjs";
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

// Audiencias del look. Un producto de hombre lleva un look masculino; uno de
// mujer, femenino; y un UNISEX lleva DOS looks (para él y para ella).
const AUD_LABEL = { m: "hombre", w: "mujer" };
const audGender = (aud) => (aud === "w" ? "women" : "men");
const audiencesOf = (product) =>
  product.gender === "unisex" ? ["m", "w"] : product.gender === "women" ? ["w"] : ["m"];

// Candidatos de OTRAS categorías para una audiencia concreta.
function candidatesFor(product, all, aud, max = 22) {
  const target = audGender(aud);
  const set = new Set(product.collections);
  const scored = all
    .filter((p) => p.id !== product.id && p.type !== product.type && matchGender(p.gender, target))
    .map((p) => ({
      p,
      overlap: p.collections.filter((c) => set.has(c)).length,
      exactGender: p.gender === target ? 1 : 0,
      priceDistance: Math.abs(Math.log((p.finalPriceUsd || 1) / (product.finalPriceUsd || 1)))
    }))
    .sort(
      (a, b) =>
        b.overlap - a.overlap ||
        b.exactGender - a.exactGender ||
        a.priceDistance - b.priceDistance
    );

  // Evita que una categoría numerosa monopolice los candidatos de Gemini.
  const preferred = {
    clothing: ["shoes", "watch", "perfume"],
    shoes: ["clothing", "watch", "perfume"],
    watch: ["clothing", "shoes", "perfume"],
    perfume: ["clothing", "shoes", "watch"]
  }[product.type] || ["clothing", "shoes", "watch", "perfume"];
  const balanced = [];
  for (const type of preferred) {
    balanced.push(...scored.filter(({ p }) => p.type === type).slice(0, Math.ceil(max / preferred.length)));
  }
  return balanced.slice(0, max).map(({ p }) => p);
}

const line = (p) =>
  `${p.id} | ${p.type} | ${p.brand} ${p.name.slice(0, 70)} | $${p.finalPriceUsd}`;

function buildPrompt(batch) {
  const blocks = batch
    .map(({ product, aud, candidates }, i) => {
      return `### Producto ${i + 1} [k=${product.id}|${aud}]
PRINCIPAL: ${line(product)} | look para: ${AUD_LABEL[aud]} | estilos:${product.collections.join(",")}
CANDIDATOS (elige SOLO de esta lista, por id):
${candidates.map(line).join("\n")}`;
    })
    .join("\n\n");

  return `Eres el estilista de Maison Privée, una boutique de lujo silencioso en Lima, Perú (relojes, perfumes, ropa y calzado de diseñador).

Para CADA producto principal, arma el look para el DESTINATARIO indicado ("look para: hombre" o "look para: mujer"): elige exactamente 3 candidatos de SU lista (ids exactos) adecuados a ese destinatario, cada uno de una categoría distinta si es posible, coherentes en estilo y ocasión. Indica también el contexto que mejor ambienta el conjunto (uno de: ${CONTEXTS.join(", ")}) y una nota en español, elegante y concreta (máx. 45 palabras), dirigida a ese destinatario, que explique por qué esas piezas combinan — menciona la ocasión o temporada y, si recomiendas un perfume, describe brevemente su carácter olfativo.

Responde SOLO JSON (usa la clave "k" tal como se te da en cada bloque):
[{"k":"<k del principal>","picks":["id1","id2","id3"],"context":"<slug>","note":"<texto>"}]

${blocks}`;
}

/** Genera recomendaciones por AUDIENCIA (muta recoIds/recoNote/recoContext y,
 *  en unisex, también recoIdsW/recoNoteW/recoContextW: un look para él y otro
 *  para ella). Proveedores: Gemini primero; si su cuota gratuita se agota,
 *  cae automáticamente a OpenAI (gpt-5.4-mini). Sin ninguno: reglas. */
export async function generateRecos(products, cacheDir) {
  const aiEnabled = geminiEnabled() || openaiEnabled();
  if (!aiEnabled) console.log("  · sin Gemini/OpenAI: recomendaciones profesionales por reglas");
  mkdirSync(cacheDir, { recursive: true });
  const cachePath = resolve(cacheDir, "recos.json");
  const cache = loadJson(cachePath);
  const byId = new Map(products.map((p) => [p.id, p]));

  // Migración del caché antiguo (clave = id, sin audiencia): sirve para los
  // productos con género definido; los unisex se regeneran (eran mixtos).
  for (const p of products) {
    if (!cache[p.id]) continue;
    if (p.gender !== "unisex") {
      const aud = p.gender === "women" ? "w" : "m";
      if (!cache[`${p.id}|${aud}`]) cache[`${p.id}|${aud}`] = cache[p.id];
    }
    delete cache[p.id];
  }

  const validPicks = (product, aud, ids = []) => {
    const target = audGender(aud);
    const seenTypes = new Set();
    return ids
      .map((id) => byId.get(id))
      .filter(
        (candidate) =>
          candidate &&
          candidate.id !== product.id &&
          candidate.type !== product.type &&
          matchGender(candidate.gender, target)
      )
      .filter((candidate) => {
        if (seenTypes.has(candidate.type)) return false;
        seenTypes.add(candidate.type);
        return true;
      })
      .map((candidate) => candidate.id)
      .slice(0, 3);
  };

  // Tareas: una por producto+audiencia (unisex = 2 looks).
  const tasks = [];
  for (const p of products) for (const aud of audiencesOf(p)) tasks.push({ product: p, aud, key: `${p.id}|${aud}` });

  // Un cambio de catálogo invalida picks cacheados que ya no son válidos.
  for (const t of tasks) {
    const entry = cache[t.key];
    if (!entry) continue;
    const picks = validPicks(t.product, t.aud, entry.picks);
    if (picks.length < Math.min(3, candidatesFor(t.product, products, t.aud).length)) {
      delete cache[t.key];
    } else {
      entry.picks = picks;
    }
  }

  const pending = aiEnabled ? tasks.filter((t) => !cache[t.key]) : [];
  console.log(`  · pendientes: ${pending.length}/${tasks.length} looks`);

  const BATCH = 14; // menos llamadas = menos cuota (nivel gratuito ≈ 10-20/min)
  let provider = geminiEnabled() ? "gemini" : openaiEnabled() ? "openai" : null;
  for (let i = 0; i < pending.length; i += BATCH) {
    if (i > 0 && provider === "gemini") await new Promise((r) => setTimeout(r, 6500)); // ritmo ~9/min
    const slice = pending.slice(i, i + BATCH).map(({ product, aud, key }) => ({
      product,
      aud,
      key,
      candidates: candidatesFor(product, products, aud)
    }));
    let res = null;
    if (provider === "gemini") {
      res = await geminiJSON(buildPrompt(slice), { tries: 2, maxQuotaWaits: 1 });
      if (!res && openaiEnabled()) {
        console.log("\n  · Gemini sin cuota disponible: continuando con OpenAI (gpt-5.4-mini)…");
        provider = "openai";
      }
    }
    if (!res && provider === "openai") res = await openaiJSON(buildPrompt(slice));
    const arr = Array.isArray(res) ? res : Array.isArray(res?.items) ? res.items : res ? [res] : [];
    for (const r of arr) {
      const key = r?.k || r?.id; // tolera respuestas con "id" en vez de "k"
      const item = slice.find((s) => s.key === key || s.product.id === key);
      if (!item) continue;
      const allowed = new Set(item.candidates.map((candidate) => candidate.id));
      const requested = (r.picks || []).filter((id) => allowed.has(id));
      const picks = validPicks(item.product, item.aud, requested);
      for (const candidate of item.candidates) {
        if (picks.length >= 3) break;
        if (picks.includes(candidate.id)) continue;
        if (picks.some((id) => byId.get(id)?.type === candidate.type)) continue;
        picks.push(candidate.id);
      }
      if (!picks.length) continue;
      cache[item.key] = {
        picks,
        context: CONTEXTS.includes(r.context) ? r.context : item.product.collections[0] || "elegante",
        note: typeof r.note === "string" ? r.note.trim().slice(0, 400) : null
      };
    }
    saveJson(cachePath, cache);
    process.stdout.write(`\r  · ${Math.min(i + BATCH, pending.length)}/${pending.length}   `);
  }
  if (pending.length) process.stdout.write("\n");

  // Aplicar al catálogo: look principal (su género; unisex = él) + look W (ella).
  const FALLBACK_NOTE =
    "Una selección equilibrada por estilo, ocasión, nivel de precio y género para completar el conjunto.";
  const resolveLook = (p, aud) => {
    const r = cache[`${p.id}|${aud}`];
    const picks = validPicks(p, aud, r?.picks || []);
    for (const candidate of candidatesFor(p, products, aud)) {
      if (picks.length >= 3) break;
      if (picks.includes(candidate.id)) continue;
      if (picks.some((id) => byId.get(id)?.type === candidate.type)) continue;
      picks.push(candidate.id);
    }
    if (!picks.length) return null;
    return {
      picks,
      note: r?.note || FALLBACK_NOTE,
      context: r?.context || p.collections[0] || "elegante"
    };
  };

  let applied = 0;
  for (const p of products) {
    const primaryAud = p.gender === "women" ? "w" : "m";
    const primary = resolveLook(p, primaryAud);
    if (primary) {
      p.recoIds = primary.picks;
      p.recoNote = primary.note;
      p.recoContext = primary.context;
      applied++;
    }
    if (p.gender === "unisex") {
      const her = resolveLook(p, "w");
      if (her) {
        p.recoIdsW = her.picks;
        p.recoNoteW = her.note;
        p.recoContextW = her.context;
      }
    } else {
      p.recoIdsW = null;
      p.recoNoteW = null;
      p.recoContextW = null;
    }
  }
  console.log(`  · recomendaciones aplicadas: ${applied}/${products.length} productos`);
}

// ---------- ejecutable directo ----------
if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  (async () => {
    const catPath = resolve(ROOT, "data/catalog.json");
    const catalog = JSON.parse(readFileSync(catPath, "utf8"));
    console.log("→ Generando recomendaciones del catálogo…");
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
