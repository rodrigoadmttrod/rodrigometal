export default function Loading() {
  return (
    <main className="container py-6">
      <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr]">
        {/* Galeria skeleton */}
        <div>
          <div className="skeleton aspect-[4/3] w-full rounded-lg" />
          <div className="mt-2 flex gap-2">
            <div className="skeleton h-16 w-20 rounded border-2" />
            <div className="skeleton h-16 w-20 rounded border-2" />
            <div className="skeleton h-16 w-20 rounded border-2" />
          </div>
        </div>
        {/* Info skeleton */}
        <div className="flex flex-col gap-4">
          <div className="skeleton h-8 w-32 rounded-lg" />
          <div className="skeleton h-6 w-full rounded-lg" />
          <div className="skeleton h-6 w-3/4 rounded-lg" />
          <div className="skeleton h-px w-full" />
          <div className="skeleton h-4 w-48 rounded-lg" />
          <div className="skeleton h-4 w-36 rounded-lg" />
          <div className="skeleton h-px w-full" />
          <div className="space-y-2">
            <div className="skeleton h-4 w-full rounded-lg" />
            <div className="skeleton h-4 w-full rounded-lg" />
            <div className="skeleton h-4 w-2/3 rounded-lg" />
          </div>
          <div className="skeleton h-12 w-full rounded-2xl" />
        </div>
      </div>
    </main>
  );
}
