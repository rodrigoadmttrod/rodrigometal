import { ListingCard, type ListingCardData } from "@/components/ListingCard";

export function ListingGrid({ listings, emptyMessage = "Nenhum anúncio encontrado." }: { listings: ListingCardData[]; emptyMessage?: string }) {
  if (listings.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-line bg-surface-muted p-10 text-center text-sm text-ink-muted">
        {emptyMessage}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {listings.map((l) => (
        <ListingCard key={l.slug} listing={l} />
      ))}
    </div>
  );
}
