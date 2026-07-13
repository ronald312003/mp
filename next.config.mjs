/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
