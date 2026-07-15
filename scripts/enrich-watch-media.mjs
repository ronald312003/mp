import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildSeedSql } from "./seed-sql.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const MEDIA_PATH = resolve(ROOT, "data/watch-official-media.json");
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36";

const readMedia = () => {
  try { return JSON.parse(readFileSync(MEDIA_PATH, "utf8")); } catch { return {}; }
};

export function watchModel(value = "") {
  const text = String(value).toUpperCase();
  return text.match(/\b[A-Z]{1,5}\d{2,5}(?:-\d{2,4}[A-Z0-9]{0,3})+\b/g)?.at(-1)
    || text.match(/\bT\d{13}\b/g)?.at(-1)
    || text.match(/\b(?:SRE|SRPE|SSC|SPB|SNR)\d{3,4}[A-Z]?\d?\b/g)?.at(-1)
    || null;
}

function modelFromProduct(product) {
  const id = String(product.sourceId || "").toUpperCase();
  if (product.brand === "Citizen") return watchModel(id.replace(/^CZ/, "")) || watchModel(product.sourceUrl);
  if (product.brand === "Tissot") return id.match(/T\d{13}/)?.[0] || watchModel(product.sourceUrl);
  if (product.brand === "Seiko") return id.replace(/^SE-/, "") || watchModel(product.sourceUrl);
  return watchModel(product.sourceUrl) || watchModel(product.name);
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

function absoluteImageUrls(html) {
  return [...new Set(
    [...html.matchAll(/https?:\\?\/\\?\/[^"'<>\s]+?\.(?:jpe?g|png|webp)(?:\?[^"'<>\s]*)?/gi)]
      .map((match) => decode(match[0].replaceAll("\\/", "/")))
  )];
}

async function discoverTissot(model) {
  const officialUrl = `https://www.tissotwatches.com/en-us/${model}.html`;
  try {
    const response = await fetch(officialUrl, {
      headers: { "user-agent": UA, "accept-language": "en-US,en;q=0.8" },
      signal: AbortSignal.timeout(15000)
    });
    if (!response.ok) return null;
    const html = await response.text();
    // Tissot usa el SKU compacto en el título y la referencia con guiones
    // en los archivos de imagen. Normalizamos ambos antes de compararlos.
    if (!new RegExp(`Model\\s+${model}`, "i").test(html)) return null;
    const normalizedModel = model.replace(/[^a-z0-9]/gi, "").toLowerCase();
    const images = absoluteImageUrls(html)
      .filter((url) => /product-pictures/i.test(url))
      .filter((url) => url.replace(/[^a-z0-9]/gi, "").toLowerCase().includes(normalizedModel))
      .map((url) => url.replace(/\?.*$/, "") + "?sm=fit&sw=1600&sh=1600");
    const unique = [...new Map(images.map((url) => [url.replace(/\?.*$/, ""), url])).values()].slice(0, 7);
    if (!unique.length) return null;
    return { brand: "Tissot", model, title: model, officialUrl, images: unique, technicalImage: null, videoUrl: null, verifiedAt: new Date().toISOString() };
  } catch {
    return null;
  }
}

async function discoverSeiko(model, name) {
  const collection = /presage/i.test(name) ? "presage" : "prospex";
  const officialUrl = `https://www.seikowatches.com/global-en/products/${collection}/${model.toLowerCase()}`;
  try {
    const response = await fetch(officialUrl, {
      headers: { "user-agent": UA, "accept-language": "en-US,en;q=0.8" },
      signal: AbortSignal.timeout(15000)
    });
    if (!response.ok) return null;
    const html = await response.text();
    if (!new RegExp(`<title>[^<]*${model}`, "i").test(html)) return null;
    const normalizedModel = model.replace(/[^a-z0-9]/gi, "").toLowerCase();
    const images = absoluteImageUrls(html)
      .filter((url) => url.replace(/[^a-z0-9]/gi, "").toLowerCase().includes(normalizedModel))
      .slice(0, 7);
    if (!images.length) return null;
    return { brand: "Seiko", model, title: model, officialUrl, images, technicalImage: null, videoUrl: null, verifiedAt: new Date().toISOString() };
  } catch {
    return null;
  }
}

async function discoverOfficial(product, model) {
  if (product.brand === "Citizen") return discoverCitizen(model);
  if (product.brand === "Tissot") return discoverTissot(model);
  if (product.brand === "Seiko") return discoverSeiko(model, product.name);
  return null;
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
    .filter((product) => product.type === "watch" && ["Citizen", "Tissot", "Seiko"].includes(product.brand))
    .map((product) => ({
      product,
      model: modelFromProduct(product)
    }))
    .filter((entry) => entry.model);

  const preferred = candidates.sort((a, b) => {
    const score = (value) => (value.product.images || []).length <= 1
      ? 0
      : /tsuyosa|promaster|prx/i.test(value.product.name) ? 1 : 2;
    return score(a) - score(b);
  });
  const limit = Math.max(0, Number(process.env.OFFICIAL_WATCH_LIMIT || 36));
  const missing = preferred.filter(({ model }) => !media[model]).slice(0, limit);
  let discovered = 0;
  await pool(missing, 4, async ({ model }) => {
    const product = preferred.find((entry) => entry.model === model)?.product;
    const found = product ? await discoverOfficial(product, model) : null;
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
    if (!official?.images?.length || official.model !== model || official.brand !== product.brand) continue;
    const generated = (product.images || []).filter((url) => url.startsWith(`/generated/${product.id}-ai-`));
    product.imageUrl = official.images[0];
    product.images = [...new Set([...official.images, ...(product.images || []), ...generated])].slice(0, 7);
    attached++;
  }
  const byBrand = candidates.reduce((acc, { product, model }) => {
    if (media[model]?.brand === product.brand) acc[product.brand] = (acc[product.brand] || 0) + 1;
    return acc;
  }, {});
  console.log(`  · relojería oficial: ${attached} modelos adjuntados (${discovered} nuevos)`, byBrand);
  return attached;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const catalogPath = resolve(ROOT, "data/catalog.json");
  const seedPath = resolve(ROOT, "db/seed.sql");
  const catalog = JSON.parse(readFileSync(catalogPath, "utf8"));
  await enrichOfficialWatchMedia(catalog.products);
  catalog.generatedAt = new Date().toISOString();
  writeFileSync(catalogPath, JSON.stringify(catalog, null, 2), "utf8");
  writeFileSync(seedPath, buildSeedSql(catalog), "utf8");
  console.log("✓ data/catalog.json y db/seed.sql sincronizados");
}
