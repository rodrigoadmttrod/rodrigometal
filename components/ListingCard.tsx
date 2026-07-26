import Link from "next/link";
import Image from "next/image";
import { formatPrice, formatLocation, timeAgo } from "@/lib/format";
import { SoldBadge } from "@/components/badges";

export type ListingCardData = {
  slug: string;
  title: string;
  city: string | null;
  state: string | null;
  price: string | null;
  priceOnRequest: boolean;
  status: string;
  createdAt: Date;
  coverUrl: string | null;
  coverAlt: string;
  sellerName: string | null;
  sellerVerified?: boolean;
};

export function ListingCard({ listing }: { listing: ListingCardData }) {
  const sold = listing.status === "sold";
  return (
    <Link
      href={`/anuncio/${listing.slug}`}
      className="card-lift group flex flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-card"
    >
      <div className="relative aspect-[4/3] bg-surface-muted">
        {listing.coverUrl ? (
          <Image
            src={listing.coverUrl}
            alt={listing.coverAlt}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-ink-muted text-sm">Sem foto</div>
        )}
        {sold && <SoldBadge className="absolute bottom-2 left-2" />}
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <p className="text-lg font-extrabold leading-tight text-brand-800">
          {sold ? "Vendido" : formatPrice(listing.price, listing.priceOnRequest)}
        </p>
        <h3 className="line-clamp-2 text-sm font-medium leading-snug text-ink group-hover:text-brand-700">
          {listing.title}
        </h3>
        <div className="mt-auto pt-2.5">
          <p className="flex items-center gap-1 text-xs font-semibold text-ink">
            <svg viewBox="0 0 16 16" fill="currentColor" className="size-3.5 shrink-0 text-ink-muted/70" aria-hidden="true">
              <path d="M8 1.5a5 5 0 0 0-5 5c0 3.5 5 8 5 8s5-4.5 5-8a5 5 0 0 0-5-5Zm0 7a2 2 0 1 1 0-4 2 2 0 0 1 0 4Z" />
            </svg>
            {formatLocation(listing.city, listing.state)}
          </p>
          <p className="mt-0.5 text-[11px] text-ink-muted/80">
            {listing.sellerName ?? "Vendedor"} · {timeAgo(listing.createdAt)}
          </p>
        </div>
      </div>
    </Link>
  );
}
