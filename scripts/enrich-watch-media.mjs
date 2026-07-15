import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const MEDIA_PATH = resolve(ROOT, "data/watch-official-media.json");
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36";

const readMedia = () => {
  try { return JSON.parse(readFileSync(MEDIA_PATH, "utf8")); } catch { return {}; }
};

export function watchModel(value = "") {
  const matches = String(value).toUpperCase().match(/\b[A-Z]{1,5}\d{2,5}(?:-\d{2,4}[A-Z0-9]{0,3})+\b/g);
  return matches?.at(-1) || null;
}

function decode(value = "") {
  return value.replaceAll("&amp;", "&").replaceAll("&#x2F;", "/");
}

function citizenMedia(html, model, officialUrl) {
  const scripts = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  let product = null;
  for (const match of scripts) {
    try {
      const parsed = JSON.parse(match[1]);
      const candidates = Array.isArray(parsed) ? parsed : [parsed];
      product = candidates.find((item) =>
        item?.["@type"] === "Product" && String(item.mpn || item.sku).toUpperCase() === model
      );
      if (product) break;
    } catch {}
  }
  if (!product) return null;

  const images = [...new Set((Array.isArray(product.image) ? product.image : [product.image])
    .filter(Boolean)
    .map((url) => decode(String(url)).replace(/width=\d+/i, "width=1600").replace(/height=\d+/i, "height=2000")))];
  if (!images.length) return null;

  const detailBlock = html.match(/<div class=["'][^"']*pdp-detail-video-image[^"']*["'][\s\S]*?<\/div>\s*<\/div>/i)?.[0] || "";
  const technicalImage = decode(detailBlock.match(/<img[^>]+src=["']([^"']+)/i)?.[1] || "") || null;
  const videoUrl = decode(
    detailBlock.match(/<(?:source|video)[^>]+src=["']([^"']+)/i)?.[1] ||
    html.match(/https:\/\/[^"'\s<>]+\.(?:mp4|webm)(?:\?[^"'\s<>]*)?/i)?.[0] ||
    ""
  ) || null;

  return {
    brand: "Citizen",
    model,
    title: product.name || model,
    officialUrl,
    images,
    technicalImage,
    videoUrl,
    verifiedAt: new Date().toISOString()
  };
}

async function discoverCitizen(model) {
  const officialUrl = `https://www.citizenwatch.com/latam/producto/${model}.html`;
  try {
    const response = await fetch(officialUrl, {
      headers: { "user-agent": UA, "accept-language": "es,en;q=0.8" },
      signal: AbortSignal.timeout(15000)
    });
    if (!response.ok) return null;
    return citizenMedia(await response.text(), model, officialUrl);
  } catch {
    return null;
  }
}

async function pool(items, size, task) {
  const queue = [...items];
  await Promise.all(Array.from({ length: size }, async () => {
    while (queue.length) await task(queue.shift());
  }));
}

/** Adjunta solo medios cuya página oficial declara el mismo MPN/SKU. */
export async function enrichOfficialWatchMedia(products) {
  const media = readMedia();
  const candidates = products
    .filter((product) => product.type === "watch" && product.brand === "Citizen")
    .map((product) => ({
      product,
      model: watchModel(product.sourceUrl || "") || watchModel(product.name)
    }))
    .filter((entry) => entry.model);

  const preferred = candidates.sort((a, b) => {
    const score = (value) => /tsuyosa|promaster/i.test(value.product.name) ? 0 : 1;
    return score(a) - score(b);
  });
  const limit = Math.max(0, Number(process.env.OFFICIAL_WATCH_LIMIT || 36));
  const missing = preferred.filter(({ model }) => !media[model]).slice(0, limit);
  let discovered = 0;
  await pool(missing, 4, async ({ model }) => {
    const found = await discoverCitizen(model);
    if (found) {
      media[model] = found;
      discovered++;
    }
  });
  if (discovered || !existsSync(MEDIA_PATH)) {
    writeFileSync(MEDIA_PATH, JSON.stringify(media, null, 2), "utf8");
  }

  let attached = 0;
  for (const { product, model } of candidates) {
    const official = media[model];
    if (!official?.images?.length || official.model !== model) continue;
    const generated = (product.images || []).filter((url) => url.startsWith(`/generated/${product.id}-ai-`));
    product.imageUrl = official.images[0];
    product.images = [...new Set([...official.images, ...generated])].slice(0, 7);
    attached++;
  }
  console.log(`  · Citizen: ${attached} modelos con medios oficiales exactos (${discovered} nuevos)`);
  return attached;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const catalogPath = resolve(ROOT, "data/catalog.json");
  const catalog = JSON.parse(readFileSync(catalogPath, "utf8"));
  await enrichOfficialWatchMedia(catalog.products);
  writeFileSync(catalogPath, JSON.stringify(catalog, null, 2), "utf8");
}
