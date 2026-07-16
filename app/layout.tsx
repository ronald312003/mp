import type { Metadata } from "next";
import { Fraunces, Hanken_Grotesk } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getExchange } from "@/lib/data";
import CartProvider from "@/components/CartProvider";
import MiniCart from "@/components/MiniCart";
import SearchOverlay from "@/components/SearchOverlay";
import { LiquidGlassDefs } from "@/components/LiquidGlass";

// Serif editorial con carácter (Fraunces: ópticamente variable, itálicas con
// personalidad — más atrayente que Playfair); Hanken Grotesk para UI/texto.
const serif = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-serif"
});
const sans = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans"
});

export const metadata: Metadata = {
  title: "Maison Privée · Lujo silencioso en relojes, moda y perfumería",
  description:
    "Relojes, ropa y perfumes de diseñador seleccionados por outfit y estilo. Lujo silencioso a precio bajo y medio. Precios en dólares y soles.",
  keywords: [
    "Maison Privée",
    "lujo silencioso",
    "relojes",
    "perfumes",
    "ropa de diseñador",
    "Seiko",
    "Tissot",
    "Saint Laurent"
  ]
};

const themeScript = `(function(){try{var t=localStorage.getItem('theme');var d=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;if(d)document.documentElement.classList.add('dark');}catch(e){}})();`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const exchange = await getExchange();
  return (
    <html lang="es" className={`${serif.variable} ${sans.variable}`} suppressHydrationWarning>
      <body>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <LiquidGlassDefs />
        <CartProvider>
          <Header rate={exchange.rate} />
          <main className="min-h-screen">{children}</main>
          <Footer rate={exchange.rate} />
          <MiniCart rate={exchange.rate} />
          <SearchOverlay rate={exchange.rate} />
        </CartProvider>
      </body>
    </html>
  );
}
