/** Skeleton loading states — shimmer animation while content loads.
 *  SEO-safe: skeletons só aparecem no cliente durante transições de rota,
 *  o conteúdo real é server-rendered e indexável. */

export function ListingCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-card">
      <div className="skeleton aspect-[4/3] w-full" />
      <div className="flex flex-col gap-2 p-4">
        <div className="skeleton h-5 w-24 rounded-lg" />
        <div className="skeleton h-4 w-full rounded-lg" />
        <div className="skeleton h-4 w-2/3 rounded-lg" />
        <div className="mt-2 flex items-center gap-1">
          <div className="skeleton h-3 w-32 rounded-lg" />
        </div>
        <div className="skeleton h-3 w-28 rounded-lg" />
      </div>
    </div>
  );
}

export function ListingGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <ListingCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function SellerCardSkeleton() {
  return (
    <div className="flex w-64 shrink-0 flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-card sm:w-auto">
      <div className="skeleton aspect-[5/3] w-full" />
      <div className="flex flex-col gap-2 p-4">
        <div className="skeleton h-4 w-32 rounded-lg" />
        <div className="skeleton h-3 w-24 rounded-lg" />
        <div className="flex gap-1.5">
          <div className="skeleton h-5 w-20 rounded-full" />
          <div className="skeleton h-5 w-24 rounded-full" />
        </div>
        <div className="skeleton h-3 w-28 rounded-lg" />
      </div>
    </div>
  );
}

export function CategoryPillSkeleton() {
  return (
    <div className="flex shrink-0 flex-col items-center gap-2">
      <div className="skeleton size-24 rounded-full sm:size-20" />
      <div className="skeleton h-3 w-16 rounded-lg" />
      <div className="skeleton h-2.5 w-12 rounded-lg" />
    </div>
  );
}

export function HomeSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4">
      {/* Hero skeleton */}
      <div className="skeleton mt-4 h-32 rounded-2xl" />

      {/* Categorias skeleton */}
      <div className="mt-8">
        <div className="skeleton h-6 w-32 rounded-lg" />
        <div className="mt-4 flex gap-4 overflow-hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <CategoryPillSkeleton key={i} />
          ))}
        </div>
      </div>

      {/* Anúncios recentes skeleton */}
      <div className="mt-10">
        <div className="skeleton h-6 w-48 rounded-lg" />
        <div className="mt-4">
          <ListingGridSkeleton count={8} />
        </div>
      </div>

      {/* Vendedores skeleton */}
      <div className="mt-10">
        <div className="skeleton h-6 w-56 rounded-lg" />
        <div className="mt-4 flex gap-4 overflow-hidden">
          {Array.from({ length: 3 }).map((_, i) => (
            <SellerCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
