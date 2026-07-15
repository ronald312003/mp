import Link from "next/link";

const TYPES = [
  {
    href: "/tienda?type=watch",
    label: "Relojes",
    sub: "Seiko · Tissot · Citizen",
    note: "Precisión y oficio"
  },
  {
    href: "/tienda?type=perfume",
    label: "Perfumes",
    sub: "Xerjoff · Creed · Dior · Armani",
    note: "Firma y memoria"
  },
  {
    href: "/tienda?type=clothing",
    label: "Ropa",
    sub: "Sandro · Thom Browne · Tom Ford",
    note: "Cortes para cada día"
  },
  {
    href: "/tienda?type=shoes",
    label: "Zapatos",
    sub: "Ferragamo · Bally · Santoni",
    note: "Forma y movimiento"
  }
];

export default function TypeStrip() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
      {TYPES.map((t, index) => (
        <Link
          key={t.href}
          href={t.href}
          className="group relative flex min-h-[210px] flex-col justify-between overflow-hidden rounded-[24px] border border-line bg-surface p-5 transition duration-500 hover:-translate-y-1 hover:border-accent hover:shadow-lift sm:min-h-[280px] sm:p-7"
        >
          <span className="pointer-events-none absolute -right-6 -top-8 font-serif text-[8rem] leading-none text-accent/10 transition duration-700 group-hover:rotate-6 group-hover:scale-110 sm:text-[11rem]">
            {String(index + 1).padStart(2, "0")}
          </span>
          <div className="relative flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted sm:text-xs">{t.note}</span>
            <span aria-hidden="true" className="text-xl text-accent transition-transform group-hover:translate-x-1">↗</span>
          </div>
          <div className="relative">
            <h3 className="font-serif text-3xl leading-none text-content sm:text-4xl">{t.label}</h3>
            <p className="mt-3 text-xs font-medium leading-relaxed text-muted sm:text-sm">{t.sub}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}
