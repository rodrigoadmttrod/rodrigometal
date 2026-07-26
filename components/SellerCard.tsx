import Link from "next/link";
import Image from "next/image";
import { VerifiedBadge } from "@/components/badges";
import { formatLocation } from "@/lib/format";

export type SellerCardData = {
  slug: string | null;
  companyName: string | null;
  city: string | null;
  state: string | null;
  description: string | null;
  photoUrl: string | null;
  isVerified: boolean;
  activeCount: number;
  listingPhotoUrl?: string | null;
  listingPhotoAlt?: string;
  sellerCategories?: string[];
};

export function SellerCard({ seller }: { seller: SellerCardData }) {
  const name = seller.companyName ?? "Vendedor";
  const displayPhoto = seller.listingPhotoUrl ?? seller.photoUrl;
  const displayAlt = seller.listingPhotoAlt ?? name;
  const cats = seller.sellerCategories ?? [];

  const inner = (
    <div className="card-lift flex w-64 shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-card sm:w-auto sm:h-full">
      {/* Foto do anúncio (estática, determinística — sem rotação para preservar ISR/SEO) */}
      <div className="relative aspect-[5/3] bg-surface-muted">
        {displayPhoto ? (
          <Image
            src={displayPhoto}
            alt={displayAlt}
            fill
            sizes="(max-width: 640px) 100vw, 33vw"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-2xl font-bold text-brand-700">
            {name.charAt(0)}
          </div>
        )}
      </div>
      {/* Conteúdo */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="flex flex-wrap items-center gap-2 text-sm font-bold text-ink">
          <span className="truncate">{name}</span>
          {seller.isVerified && <VerifiedBadge />}
        </p>
        <p className="text-xs text-ink-muted">{formatLocation(seller.city, seller.state)}</p>
        {/* Categorias em que o vendedor atua */}
        {cats.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {cats.map((cat) => (
              <span
                key={cat}
                className="rounded-full bg-brand-50 px-2.5 py-0.5 text-[11px] font-medium text-brand-700"
              >
                {cat}
              </span>
            ))}
          </div>
        )}
        <p className="mt-auto pt-1 text-xs font-semibold text-accent-dark">
          {seller.activeCount} anúncio{seller.activeCount === 1 ? "" : "s"} ativo{seller.activeCount === 1 ? "" : "s"}
        </p>
      </div>
    </div>
  );
  if (!seller.slug) return inner;
  return <Link href={`/vendedor/${seller.slug}`}>{inner}</Link>;
}
