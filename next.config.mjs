import { fileURLToPath } from "node:url";
import path from "node:path";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // shadergradient/three se compilan como ESM del proyecto (permite
  // tree-shaking correcto).
  transpilePackages: ["@shadergradient/react", "three"],
  webpack: (config) => {
    // El paquete @shadergradient/react sólo declara la condición "import" en su
    // campo exports, lo que hace fallar la resolución de webpack en Next
    // ("Package path . is not exported"). Apuntamos el alias directamente al
    // bundle ESM para saltarnos la resolución por exports.
    config.resolve.alias["@shadergradient/react$"] = path.join(
      projectRoot,
      "node_modules/@shadergradient/react/dist/index.mjs"
    );
    return config;
  },
  images: {
    // El admin puede añadir imágenes desde CUALQUIER URL; con unoptimized
    // se renderizan sin pasar por el optimizador (no requiere allowlist de host).
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "cdn2.jomashop.com" },
      { protocol: "https", hostname: "cdn.jomashop.com" },
      { protocol: "https", hostname: "cache.net-a-porter.com" },
      { protocol: "https", hostname: "www.theoutnet.com" },
      { protocol: "https", hostname: "images.unsplash.com" }
    ]
  }
};

export default nextConfig;
