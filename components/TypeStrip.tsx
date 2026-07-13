import Link from "next/link";
import Image from "next/image";

const TYPES = [
  {
    href: "/tienda?type=watch",
    label: "Relojes",
    sub: "Seiko · Tissot · Citizen · Casio",
    img: "https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&w=800&q=80"
  },
  {
    href: "/tienda?type=perfume",
    label: "Perfumes",
    sub: "Xerjoff · Creed · Dior · Armani",
    img: "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=800&q=80"
  },
  {
    href: "/tienda?type=clothing",
    label: "Ropa",
    sub: "Saint Laurent · Valentino · Balmain",
    img: "https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?auto=format&fit=crop&w=800&q=80"
  },
  {
    href: "/tienda?type=shoes",
    label: "Zapatos",
    sub: "Ferragamo · Jimmy Choo · Versace",
    img: "https://images.unsplash.com/photo-1449505278894-297fdb3edbc1?auto=format&fit=crop&w=800&q=80"
  }
];

export default function TypeStrip() {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {TYPES.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          className="group relative flex aspect-[4/5] flex-col justify-end overflow-hidden rounded-lg"
        >
          <Image
            src={t.img}
            alt={t.label}
            fill
            sizes="(max-width:1024px) 50vw, 25vw"
            className="object-cover transition-transform duration-[900ms] group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <div className="relative p-5 text-white">
            <h3 className="font-serif text-2xl">{t.label}</h3>
            <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-white/70">{t.sub}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}
