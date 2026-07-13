import { fmtUsd, fmtPen, usdToPen } from "@/lib/format";

export default function PriceTag({
  usd,
  rate,
  size = "md"
}: {
  usd: number;
  rate: number;
  size?: "sm" | "md" | "lg";
}) {
  const pen = usdToPen(usd, rate);
  const usdClass =
    size === "lg" ? "text-2xl" : size === "sm" ? "text-sm" : "text-base";
  const penClass = size === "lg" ? "text-base" : "text-xs";
  return (
    <div className="flex flex-col">
      <span className={`font-serif ${usdClass} text-content`}>{fmtUsd(usd)}</span>
      <span className={`${penClass} text-muted`}>{fmtPen(pen)}</span>
    </div>
  );
}
