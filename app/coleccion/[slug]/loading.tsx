import { SkeletonGrid } from "@/components/SkeletonCard";

export default function Loading() {
  return (
    <div>
      <div className="skeleton h-[42vh] min-h-[280px] w-full rounded-none" />
      <div className="container-shell py-10">
        <div className="mb-8 flex gap-3 border-b border-line pb-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton h-8 w-20" />
          ))}
        </div>
        <SkeletonGrid count={8} />
      </div>
    </div>
  );
}
