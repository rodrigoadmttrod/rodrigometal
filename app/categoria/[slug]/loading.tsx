import { ListingGridSkeleton } from "@/components/Skeleton";

export default function Loading() {
  return (
    <main className="container py-6">
      <div className="skeleton h-8 w-64 rounded-lg" />
      <div className="skeleton mt-2 h-4 w-40 rounded-lg" />
      <div className="mt-6">
        <ListingGridSkeleton count={8} />
      </div>
    </main>
  );
}
