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
const auditAll = process.env.IMAGE_AUDIT_ALL !== "0";
const minimumImages = Math.max(1, Number(process.env.IMAGE_AUDIT_MIN_IMAGES || 3));
const coverageOnly = process.env.IMAGE_AUDIT_COVERAGE_ONLY === "1";
const failureDetails = process.env.IMAGE_AUDIT_FAILURE_DETAILS !== "0";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36";

const products = catalog.products
  .filter((product) => requestedTypes.has(product.type))
  .slice(0, limit || undefined);

function imageIdentity(value) {
  try {
    const url = new URL(value);
    if (/\.jomashop\.com$/i.test(url.hostname)) {
      url.pathname = url.pathname.replace(/\/media\/catalog\/product\/cache\/[^/]+\//i, "/media/catalog/product/");
      url.search = "";
    }
    return url.toString();
  } catch {
    return String(value || "");
  }
}

function distinctImages(product) {
  const seen = new Set();
  return [product.imageUrl, ...(product.images || [])].filter((url) => {
    const key = imageIdentity(url);
    if (!url || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

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

const results = [];
if (coverageOnly) {
  const queue = [...products];
  await Promise.all(Array.from({ length: concurrency }, async () => {
    while (queue.length) {
      const product = queue.shift();
      const images = distinctImages(product);
      let reachable = 0;
      for (const [imageIndex, url] of images.entries()) {
        const result = await inspect(url);
        results.push({
          id: product.id,
          type: product.type,
          brand: product.brand,
          name: product.name,
          imageCount: images.length,
          imageIndex,
          url,
          ...result
        });
        if (result.ok) reachable++;
        if (reachable >= minimumImages) break;
      }
    }
  }));
} else {
  const queue = products.flatMap((product) => {
    const images = distinctImages(product);
    return (auditAll ? images : images.slice(0, 1)).map((url, imageIndex) => ({
      product,
      url,
      imageIndex,
      imageCount: images.length
    }));
  });
  await Promise.all(Array.from({ length: concurrency }, async () => {
    while (queue.length) {
      const { product, url, imageIndex, imageCount } = queue.shift();
      const result = await inspect(url);
      results.push({
        id: product.id,
        type: product.type,
        brand: product.brand,
        name: product.name,
        imageCount,
        imageIndex,
        url,
        ...result
      });
    }
  }));
}

const failures = results.filter((result) => !result.ok);
const sparse = products
  .map((product) => ({
    id: product.id,
    type: product.type,
    brand: product.brand,
    name: product.name,
    imageCount: distinctImages(product).length
  }))
  .filter((result) => result.imageCount < minimumImages);
const usable = products.map((product) => {
  const rows = results.filter((result) => result.id === product.id);
  return {
    id: product.id,
    type: product.type,
    brand: product.brand,
    name: product.name,
    reachableImages: rows.filter((result) => result.ok).length,
    checkedImages: rows.length
  };
});
const unusable = usable.filter((result) => result.reachableImages < minimumImages);
const byType = Object.fromEntries([...requestedTypes].map((type) => {
  const rows = results.filter((result) => result.type === type);
  const typedProducts = products.filter((product) => product.type === type);
  const brokenProducts = new Set(rows.filter((result) => !result.ok).map((result) => result.id));
  return [type, {
    products: typedProducts.length,
    checkedImages: rows.length,
    reachableImages: rows.filter((result) => result.ok).length,
    brokenImages: rows.filter((result) => !result.ok).length,
    productsWithBrokenImages: brokenProducts.size,
    belowMinimum: typedProducts.filter((product) => distinctImages(product).length < minimumImages).length,
    belowReachableMinimum: unusable.filter((product) => product.type === type).length
  }];
}));

console.log(JSON.stringify({
  auditAll,
  coverageOnly,
  minimumImages,
  byType,
  brokenImageCount: failures.length,
  failures: failureDetails ? failures : undefined,
  sparse,
  unusable
}, null, 2));
if (unusable.length || sparse.length) process.exitCode = 1;
