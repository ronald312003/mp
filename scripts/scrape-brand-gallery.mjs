// ============================================================
//  Galería editorial por marca desde Pinterest (fija en data/).
//  1) Se scrapea la búsqueda pública de Pinterest y se extraen las
//     imágenes de i.pinimg.com del HTML server-rendered.
//  2) Respaldo: Bing Images filtrado a i.pinimg.com.
//  3) Se normaliza a la variante /736x/ (hotlink estable; /originals/
//     suele bloquear), se verifica que cada URL sirva imagen y se
//     escribe data/brand-gallery.json para consumo estático de la app.
//  Uso: node scripts/scrape-brand-gallery.mjs
// ============================================================

import { writeFileSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = resolve(ROOT, "data/brand-gallery.json");
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

const PER_BRAND = 10;

// Consultas afinadas a la firma visual de cada casa.
const QUERIES = {
  "Christian Louboutin": "christian louboutin red bottom heels editorial",
  "Saint Laurent": "saint laurent ysl opyum heels editorial",
  "Tom Ford": "tom ford perfume ombre leather aesthetic",
  "Jimmy Choo": "jimmy choo crystal heels editorial",
  Dior: "lady dior bag editorial aesthetic",
  Valentino: "valentino garavani rockstud red couture",
  Versace: "versace medusa gold baroque editorial",
  Ferragamo: "salvatore ferragamo shoes craftsmanship",
  Prada: "prada triangle bag editorial aesthetic",
  "Maison Margiela": "maison margiela tabi editorial",
  "Thom Browne": "thom browne grey suit editorial",
  Missoni: "missoni zigzag knitwear editorial",
  Sandro: "sandro paris outfit editorial",
  Bally: "bally leather shoes editorial",
  Dunhill: "dunhill london tailoring editorial",
  "Ralph Lauren": "ralph lauren polo old money aesthetic"
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Toda imagen pinimg → variante 736x (misma ruta, hotlink permitido). */
function to736(url) {
  return url.replace(/i\.pinimg\.com\/[^/]+\//, "i.pinimg.com/736x/");
}

function pinimgMatches(text) {
  const re = /https:\/\/i\.pinimg\.com\/[0-9]+x\/[a-f0-9/]{6,}\.(?:jpg|jpeg|png|webp)/g;
  return [...new Set([...text.matchAll(re)].map((m) => to736(m[0])))];
}

async function fromPinterest(query) {
  const url = `https://www.pinterest.com/search/pins/?q=${encodeURIComponent(query)}&rs=typed`;
  const res = await fetch(url, {
    headers: { "user-agent": UA, "accept-language": "en-US,en;q=0.9" },
    signal: AbortSignal.timeout(20000)
  });
  if (!res.ok) return [];
  return pinimgMatches(await res.text());
}

async function fromBing(query) {
  const url =
    "https://www.bing.com/images/search?q=" +
    encodeURIComponent(`${query} pinterest`) +
    "&form=HDRSC2&first=1";
  const res = await fetch(url, {
    headers: { "user-agent": UA, "accept-language": "en-US,en;q=0.9" },
    signal: AbortSignal.timeout(20000)
  });
  if (!res.ok) return [];
  const html = await res.text();
  const urls = [];
  for (const match of html.matchAll(/murl(?:&quot;|"):(?:&quot;|")(https?:\/\/[^"&]+?)(?:&quot;|")/g)) {
    urls.push(match[1].replace(/\\\//g, "/"));
  }
  // Sólo pinimg (es la galería "de Pinterest"), normalizado a 736x.
  return [...new Set(urls.filter((u) => /i\.pinimg\.com/.test(u)).map(to736))];
}

async function isImage(url) {
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
}

async function gather(brand, query) {
  let candidates = [];
  try {
    candidates = await fromPinterest(query);
  } catch {}
  if (candidates.length < 6) {
    try {
      candidates = [...new Set([...candidates, ...(await fromBing(query))])];
    } catch {}
  }
  const verified = [];
  for (const url of candidates.slice(0, 28)) {
    if (await isImage(url)) verified.push(url);
    if (verified.length >= PER_BRAND) break;
  }
  console.log(`  ${brand}: ${verified.length} imágenes (${candidates.length} candidatas)`);
  return verified;
}

const current = (() => {
  try { return JSON.parse(readFileSync(OUT, "utf8")); } catch { return {}; }
})();

console.log("Scrapeando galerías de Pinterest por marca…");
for (const [brand, query] of Object.entries(QUERIES)) {
  const images = await gather(brand, query);
  // No pisar una galería buena con un scrape fallido.
  if (images.length >= 4 || !current[brand]?.images?.length) {
    current[brand] = { query, images };
  }
  await sleep(600);
}

writeFileSync(OUT, JSON.stringify(current, null, 2) + "\n");
const total = Object.values(current).reduce((n, b) => n + (b.images?.length || 0), 0);
console.log(`OK → data/brand-gallery.json (${Object.keys(current).length} marcas, ${total} imágenes)`);
