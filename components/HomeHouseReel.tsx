import Image from "next/image";
import Link from "next/link";
import { HOUSE_IMAGES } from "@/lib/house-images";
import { brandHero, houseSlug } from "@/lib/house-media";

const HOUSES = ["Dior", "Prada", "Christian Louboutin"] as const;

export default function HomeHouseReel() {
  return (
    <div className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 lg:grid lg:grid-cols-3 lg:overflow-visible">
      {HOUSES.map((name, index) => {
        const visual = HOUSE_IMAGES[name];
        const hero = brandHero(name);
        return (
          <article key={name} className="group relative min-w-[84vw] snap-center overflow-hidden rounded-[26px] bg-inverse sm:min-w-[58vw] lg:min-w-0">
            <Link href={`/casas/${houseSlug(name)}`} className="relative block aspect-[4/3] overflow-hidden">
              <Image
                src={hero || visual.imageUrl}
                alt={visual?.imageAlt || `Boutique de ${name}`}
                fill
                unoptimized
                sizes="(max-width: 640px) 84vw, (max-width: 1024px) 58vw, 33vw"
                className="object-cover opacity-85 transition duration-[1100ms] ease-out group-hover:scale-105 group-hover:opacity-100"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-5 text-white sm:p-7">
                <div>
                  <span className="text-[10px] uppercase tracking-[0.18em] text-white/65">Casa {String(index + 1).padStart(2, "0")}</span>
                  <h3 className="mt-1 font-serif text-3xl sm:text-4xl">{name}</h3>
                  <span className="link-underline mt-2 inline-block text-sm font-medium text-white/80">Visitar la casa</span>
                </div>
                <span aria-hidden="true" className="text-2xl transition-transform duration-300 ease-out group-hover:translate-x-1 group-hover:-translate-y-1">↗</span>
              </div>
            </Link>
          </article>
        );
      })}
    </div>
  );
}
