import { ListingGridSkeleton } from "@/components/Skeleton";

export default function Loading() {
  return (
    <main className="container py-6">
      <div className="skeleton h-8 w-48 rounded-lg" />
      <div className="skeleton mt-2 h-4 w-32 rounded-lg" />
      <div className="mt-6">
        <ListingGridSkeleton count={8} />
      </div>
    </main>
  );
}
