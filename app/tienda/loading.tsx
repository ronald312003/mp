import { SkeletonGrid } from "@/components/SkeletonCard";

export default function Loading() {
  return (
    <div className="container-shell py-10">
      <div className="mb-8">
        <div className="skeleton h-2.5 w-20" />
        <div className="skeleton mt-3 h-9 w-72" />
      </div>
      <div className="mb-8 flex gap-3 border-b border-line pb-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="skeleton h-8 w-24" />
        ))}
      </div>
      <SkeletonGrid count={12} />
    </div>
  );
}
