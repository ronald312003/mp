export default function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-editorial ring-1 ring-line">
      <div className="skeleton aspect-[4/5]" />
      <div className="space-y-2 p-4">
        <div className="skeleton h-2.5 w-1/3" />
        <div className="skeleton h-3 w-4/5" />
        <div className="skeleton mt-3 h-4 w-1/2" />
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
