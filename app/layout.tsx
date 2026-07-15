import type { Metadata } from "next";
import { Cormorant_Garamond, Hanken_Grotesk } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getExchange } from "@/lib/data";
import CartProvider from "@/components/CartProvider";

// Serif editorial para titulares; Hanken Grotesk (sólida y legible) para UI/texto.
const serif = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
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
        <CartProvider>
          <Header rate={exchange.rate} />
          <main className="min-h-screen">{children}</main>
          <Footer rate={exchange.rate} source={exchange.source} />
        </CartProvider>
      </body>
    </html>
  );
}
