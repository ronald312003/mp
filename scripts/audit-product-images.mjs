import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const catalog = JSON.parse(readFileSync(resolve("data/catalog.json"), "utf8"));
const requestedTypes = new Set(
  String(process.env.IMAGE_AUDIT_TYPES || "watch,perfume")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
);
const concurrency = Math.max(1, Number(process.env.IMAGE_AUDIT_CONCURRENCY || 12));
const limit = Math.max(0, Number(process.env.IMAGE_AUDIT_LIMIT || 0));
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36";

const products = catalog.products
  .filter((product) => requestedTypes.has(product.type))
  .slice(0, limit || undefined);

async function inspect(url) {
  if (!url) return { ok: false, reason: "empty-url" };
  if (url.startsWith("/")) return { ok: true, status: 200, contentType: "local" };
  const origin = (() => {
    try { return `${new URL(url).origin}/`; } catch { return ""; }
  })();
  for (const referer of ["", origin]) {
    try {
      const response = await fetch(url, {
        headers: {
          "user-agent": UA,
          accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
          range: "bytes=0-65535",
          ...(referer ? { referer } : {})
        },
        redirect: "follow",
        signal: AbortSignal.timeout(15000)
      });
      const type = response.headers.get("content-type") || "";
      await response.body?.cancel();
      if (response.ok && type.startsWith("image/")) {
        return { ok: true, status: response.status, contentType: type };
      }
      if (response.status === 416 && type.startsWith("image/")) {
        return { ok: true, status: response.status, contentType: type };
      }
      if (referer) return { ok: false, status: response.status, contentType: type, reason: "upstream" };
    } catch (error) {
      if (referer) return { ok: false, reason: error?.name || "fetch" };
    }
  }
  return { ok: false, reason: "fetch" };
}

const queue = [...products];
const results = [];
await Promise.all(Array.from({ length: concurrency }, async () => {
  while (queue.length) {
    const product = queue.shift();
    const result = await inspect(product.imageUrl);
    results.push({
      id: product.id,
      type: product.type,
      brand: product.brand,
      name: product.name,
      imageCount: product.images?.length || 0,
      url: product.imageUrl,
      ...result
    });
  }
}));

const failures = results.filter((result) => !result.ok);
const sparse = results.filter((result) => result.imageCount < 2);
const byType = Object.fromEntries([...requestedTypes].map((type) => {
  const rows = results.filter((result) => result.type === type);
  return [type, {
    checked: rows.length,
    reachable: rows.filter((result) => result.ok).length,
    broken: rows.filter((result) => !result.ok).length,
    singleImage: rows.filter((result) => result.imageCount < 2).length
  }];
}));

console.log(JSON.stringify({ byType, failures, sparse }, null, 2));
if (failures.length) process.exitCode = 1;
