// ============================================================
//  Hero "luxury" por casa (boutique/vitrina/campaña) desde Pinterest.
//  Añade la clave `hero` a data/brand-gallery.json. Prefiere la variante
//  /1200x/ (calidad para full-bleed) y cae a /736x/ si no existe.
//  Uso: node scripts/scrape-house-heroes.mjs
// ============================================================

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = resolve(ROOT, "data/brand-gallery.json");
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

const HERO_QUERIES = {
  "Christian Louboutin": "christian louboutin boutique interior red luxury",
  "Saint Laurent": "saint laurent boutique storefront black luxury",
  "Tom Ford": "tom ford boutique store luxury dark",
  "Jimmy Choo": "jimmy choo boutique store luxury",
  Dior: "dior boutique avenue montaigne facade luxury",
  Valentino: "valentino boutique store luxury interior",
  Versace: "versace boutique store gold luxury",
  Ferragamo: "ferragamo boutique florence luxury",
  Prada: "prada boutique store green luxury",
  "Maison Margiela": "maison margiela store white interior",
  "Thom Browne": "thom browne store grey interior",
  Missoni: "missoni boutique colorful knit store",
  Sandro: "sandro paris boutique storefront",
  Bally: "bally boutique store luxury leather",
  Dunhill: "dunhill bourdon house london luxury",
  "Ralph Lauren": "ralph lauren mansion store interior luxury"
};

const isImage = async (url) => {
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: { "user-agent": UA, range: "bytes=0-2048" },
      signal: AbortSignal.timeout(10000)
    });
    return res.ok && (res.headers.get("content-type") || "").startsWith("image/");
  } catch {
    return false;
  }
};

async function candidates(query) {
  const found = new Set();
  for (const src of [
    `https://www.pinterest.com/search/pins/?q=${encodeURIComponent(query)}&rs=typed`,
    `https://www.bing.com/images/search?q=${encodeURIComponent(query + " pinterest")}&form=HDRSC2&first=1`
  ]) {
    try {
      const res = await fetch(src, {
        headers: { "user-agent": UA, "accept-language": "en-US,en;q=0.9" },
        signal: AbortSignal.timeout(20000)
      });
      const html = await res.text();
      for (const m of html.matchAll(/https:\/\/i\.pinimg\.com\/[0-9]+x\/[a-f0-9/]{6,}\.(?:jpg|jpeg|png|webp)/g)) {
        found.add(m[0]);
      }
    } catch {}
    if (found.size >= 8) break;
  }
  return [...found];
}

const data = JSON.parse(readFileSync(OUT, "utf8"));
for (const [brand, query] of Object.entries(HERO_QUERIES)) {
  let hero = null;
  for (const url of (await candidates(query)).slice(0, 10)) {
    // Mejor calidad primero: 1200x → 736x.
    for (const size of ["1200x", "736x"]) {
      const candidate = url.replace(/i\.pinimg\.com\/[^/]+\//, `i.pinimg.com/${size}/`);
      if (await isImage(candidate)) { hero = candidate; break; }
    }
    if (hero) break;
  }
  if (hero) {
    data[brand] = { ...(data[brand] || { query, images: [] }), hero };
  }
  console.log(`  ${brand}: ${hero ? "OK " + hero.slice(0, 60) : "sin hero (se usa fallback)"}`);
  await new Promise((r) => setTimeout(r, 500));
}
writeFileSync(OUT, JSON.stringify(data, null, 2) + "\n");
console.log("Heros escritos en data/brand-gallery.json");
