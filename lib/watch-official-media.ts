import officialMedia from "@/data/watch-official-media.json";

export interface WatchOfficialMedia {
  brand: string;
  model: string;
  title: string;
  officialUrl: string;
  images: string[];
  technicalImage: string | null;
  videoUrl: string | null;
  verifiedAt: string;
}

export function getOfficialWatchMedia(name: string, sourceHint = ""): WatchOfficialMedia | null {
  const haystack = `${sourceHint} ${name}`.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const model = Object.keys(officialMedia).find((key) =>
    haystack.includes(key.toUpperCase().replace(/[^A-Z0-9]/g, ""))
  );
  if (!model) return null;
  const item = (officialMedia as Record<string, WatchOfficialMedia>)[model];
  return item?.model === model ? item : null;
}
