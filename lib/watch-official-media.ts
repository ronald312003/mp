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

function modelFromName(value: string) {
  return value.toUpperCase().match(/\b[A-Z]{1,5}\d{2,5}(?:-\d{2,4}[A-Z0-9]{0,3})+\b/g)?.at(-1);
}

export function getOfficialWatchMedia(name: string, sourceHint = ""): WatchOfficialMedia | null {
  const model = modelFromName(sourceHint) || modelFromName(name);
  if (!model) return null;
  const item = (officialMedia as Record<string, WatchOfficialMedia>)[model];
  return item?.model === model ? item : null;
}
