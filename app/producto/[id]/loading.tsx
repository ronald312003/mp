export default function Loading() {
  return (
    <div className="container-shell py-8">
      <div className="skeleton mb-6 h-3 w-56" />
      <div className="grid gap-10 lg:grid-cols-2">
        <div className="skeleton aspect-square rounded-editorial" />
        <div className="space-y-4">
          <div className="skeleton h-2.5 w-24" />
          <div className="skeleton h-9 w-4/5" />
          <div className="flex gap-2">
            <div className="skeleton h-6 w-20 rounded-full" />
            <div className="skeleton h-6 w-20 rounded-full" />
          </div>
          <div className="skeleton mt-4 h-16 w-40" />
          <div className="skeleton h-4 w-full" />
          <div className="skeleton h-4 w-5/6" />
          <div className="skeleton mt-6 h-12 w-full" />
        </div>
      </div>
    </div>
  );
}
