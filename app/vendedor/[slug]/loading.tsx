import { ListingGridSkeleton } from "@/components/Skeleton";

export default function Loading() {
  return (
    <main className="container py-6">
      {/* Perfil skeleton */}
      <div className="flex gap-4 rounded-2xl border border-line bg-white p-6 shadow-card">
        <div className="skeleton size-16 rounded-full" />
        <div className="flex flex-col gap-2">
          <div className="skeleton h-5 w-40 rounded-lg" />
          <div className="skeleton h-4 w-28 rounded-lg" />
          <div className="skeleton h-4 w-48 rounded-lg" />
        </div>
      </div>
      {/* Listings skeleton */}
      <div className="mt-8">
        <div className="skeleton h-6 w-40 rounded-lg" />
        <div className="mt-4">
          <ListingGridSkeleton count={8} />
        </div>
      </div>
    </main>
  );
}
