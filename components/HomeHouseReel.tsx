import Image from "next/image";
import Link from "next/link";
import { HOUSE_IMAGES } from "@/lib/house-images";

const HOUSES = ["Dior", "Prada", "Christian Louboutin"] as const;

export default function HomeHouseReel() {
  return (
    <div className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 lg:grid lg:grid-cols-3 lg:overflow-visible">
      {HOUSES.map((name, index) => {
        const visual = HOUSE_IMAGES[name];
        return (
          <article key={name} className="group relative min-w-[84vw] snap-center overflow-hidden rounded-[26px] bg-inverse sm:min-w-[58vw] lg:min-w-0">
            <Link href="/casas" className="relative block aspect-[4/3] overflow-hidden">
              <Image
                src={visual.imageUrl}
                alt={visual.imageAlt}
                fill
                unoptimized
                sizes="(max-width: 640px) 84vw, (max-width: 1024px) 58vw, 33vw"
                className="object-cover opacity-80 transition duration-[1200ms] group-hover:scale-105 group-hover:opacity-95"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-5 text-white sm:p-7">
                <div>
                  <span className="text-[10px] uppercase tracking-[0.18em] text-white/65">Casa {String(index + 1).padStart(2, "0")}</span>
                  <h3 className="mt-1 font-serif text-3xl sm:text-4xl">{name}</h3>
                </div>
                <span aria-hidden="true" className="text-2xl">↗</span>
              </div>
            </Link>
            <a href={visual.creditUrl} target="_blank" rel="noreferrer" className="absolute right-3 top-3 rounded-full bg-black/55 px-3 py-1 text-[9px] text-white/80 backdrop-blur hover:text-white">
              Foto: {visual.credit}
            </a>
          </article>
        );
      })}
    </div>
  );
}
