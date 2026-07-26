import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  getListingBySlug,
  getSellerOtherListings,
  getSimilarListings,
} from "@/lib/queries/listing";
import { Gallery } from "@/components/Gallery";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { SpecTable } from "@/components/SpecTable";
import { ListingGrid } from "@/components/ListingGrid";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { SoldBadge, VerifiedBadge, ConditionBadge } from "@/components/badges";
import { ListingJsonLd, BreadcrumbJsonLd } from "@/components/JsonLd";
import { ViewTracker } from "@/components/ViewTracker";
import { formatPrice, formatLocation, timeAgo } from "@/lib/format";
import { SITE } from "@/lib/site";

// ~6h (spec 4.3): anúncio quase não muda e a edição dispara revalidatePath sob demanda
export const revalidate = 21600;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const listing = await getListingBySlug(slug);
  if (!listing) return { title: "Anúncio não encontrado" };
  const sold = listing.status === "sold";
  const archived = listing.status === "archived";
  const priceTxt = sold ? "Vendido" : formatPrice(listing.price, listing.priceOnRequest);
  const title = `${listing.title} — ${priceTxt}`;
  const rawDesc = (listing.description ?? "").slice(0, 160);
  const description = rawDesc.length === 160 ? rawDesc.replace(/[,\s]+$/, "") + "…" : rawDesc;
  const cover = listing.images[0]?.url;
  return {
    title,
    description,
    alternates: {
      canonical: `/anuncio/${listing.slug}`,
    },
    ...(archived ? { robots: { index: false, follow: true } } : {}),
    openGraph: {
      title: `${listing.title} — ${priceTxt} | ${SITE.name}`,
      description,
      type: "website",
      images: cover ? [{ url: cover, width: 1200, height: 630, alt: listing.title }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      images: cover ? [cover] : undefined,
    },
  };
}

export default async function ListingPage({ params }: Props) {
  const { slug } = await params;
  const listing = await getListingBySlug(slug);
  if (!listing) notFound(); // apenas slug inexistente ou rascunho; vendido NUNCA cai aqui

  // viewCount incrementado via beacon no cliente (a página é ISR, não roda server code por view)

  const sold = listing.status === "sold";
  const sellerOthers = sold
    ? await getSellerOtherListings({ sellerId: listing.sellerId, excludeListingId: listing.id, limit: 4 })
    : [];
  const sellerOtherIds = new Set(sellerOthers.map((s) => s.id));
  // pede mais e filtra os já mostrados no bloco do vendedor, evitando cards duplicados
  const similar = (
    await getSimilarListings({
      listingId: listing.id,
      categoryId: listing.categoryId,
      state: listing.state,
      limit: 4 + sellerOthers.length,
    })
  )
    .filter((s) => !sellerOtherIds.has(s.id))
    .slice(0, 4);

  const sellerName = listing.sellerName ?? listing.sellerContactName ?? "Vendedor";
  const catName = listing.categoryName ?? "equipamentos industriais";
  const waMessage = sold
    ? `Olá! Vi que o anúncio "${listing.title}" já foi vendido no ${SITE.name}. Vocês têm outro parecido disponível?`
    : `Olá! Vi o anúncio "${listing.title}" no ${SITE.name} e tenho interesse. Ainda está disponível?`;

  const coverUrl = listing.images[0]?.url ?? null;
  const canonicalUrl = `${SITE.url}/anuncio/${listing.slug}`;

  return (
    <main className="container py-6">
      <ViewTracker listingId={listing.id} />
      <ListingJsonLd
        title={listing.title}
        description={listing.description}
        price={listing.price}
        priceOnRequest={listing.priceOnRequest}
        status={listing.status}
        city={listing.city}
        state={listing.state}
        slug={listing.slug}
        imageUrl={coverUrl}
        sellerName={sellerName}
        sellerPhone={listing.sellerPhone}
        createdAt={listing.createdAt}
        categoryName={listing.categoryName}
      />
      <BreadcrumbJsonLd
        items={[
          { name: "Início", url: SITE.url },
          ...(listing.categorySlug ? [{ name: catName, url: `${SITE.url}/categoria/${listing.categorySlug}` }] : []),
          { name: listing.title, url: canonicalUrl },
        ]}
      />
      <Breadcrumbs
        items={[
          { label: "Início", href: "/" },
          ...(listing.categorySlug
            ? [{ label: catName, href: `/categoria/${listing.categorySlug}` }]
            : []),
          { label: listing.title },
        ]}
      />

      <div className="mt-4 grid gap-8 lg:grid-cols-[3fr_2fr]">
        {/* Coluna esquerda: galeria + descrição + ficha técnica — order-2 on mobile so title shows first */}
        <div className="order-2 lg:order-1">
          <Gallery
            images={listing.images.map((i) => ({ url: i.url, altText: i.altText }))}
            title={listing.title}
          />

          {/* Mobile: ficha técnica antes da descrição (comprador industrial decide pela spec)
              Desktop: descrição antes (ficha já está visível na coluna lateral) */}
          <div className="mt-6 flex flex-col">
            <div className="order-2 md:order-1">
              <section aria-label="Descrição">
                <h2 className="mb-2 text-lg font-bold text-ink">Descrição</h2>
                <p className="whitespace-pre-line text-sm leading-relaxed text-ink">
                  {listing.description}
                </p>
              </section>
            </div>
            <div className="order-1 mb-6 md:order-2 md:mb-0 md:mt-6">
              <SpecTable specs={listing.specs} />
            </div>
          </div>
        </div>

        {/* Coluna direita: preço + contato + vendedor — order-1 on mobile so title shows first */}
        <div className="order-1 lg:order-2">
          <div className="rounded-lg border border-line bg-white p-5 shadow-card">
            <div className="flex flex-wrap items-center gap-2">
              {sold && <SoldBadge />}
              <ConditionBadge condition={listing.itemCondition} />
            </div>

            <h1 className="mt-2 text-xl font-bold leading-snug text-ink">{listing.title}</h1>
            <p className="mt-1 text-sm text-ink-muted">
              {formatLocation(listing.city, listing.state)} · publicado {timeAgo(listing.createdAt)}
            </p>

            {sold ? (
              <div className="mt-4 rounded-lg border border-accent/30 bg-accent/5 p-4">
                <p className="text-sm font-semibold text-ink">
                  Este já saiu — mas {sellerName} trabalha com {catName.toLowerCase()} e costuma
                  ter disponível.
                </p>
                <p className="mt-1 text-xs text-ink-muted">
                  Chame no WhatsApp e pergunte se há outro igual ou parecido
                  {listing.sellerActiveCount > 0 && (
                    <>
                      {" "}
                      — no momento há{" "}
                      <strong>
                        {listing.sellerActiveCount} anúncio
                        {listing.sellerActiveCount === 1 ? "" : "s"} ativo
                        {listing.sellerActiveCount === 1 ? "" : "s"}
                      </strong>{" "}
                      deste vendedor
                    </>
                  )}
                  .
                </p>
              </div>
            ) : (
              <p className="mt-4 text-3xl font-bold text-brand-800">
                {formatPrice(listing.price, listing.priceOnRequest)}
              </p>
            )}

            <div className="mt-5">
              <WhatsAppButton
                phoneE164={listing.sellerPhone}
                message={waMessage}
                sellerId={listing.sellerId}
                listingId={listing.id}
                sourcePage={`/anuncio/${listing.slug}`}
                size="lg"
                fixedOnMobile
              />
            </div>
            <p className="mt-3 text-center text-xs text-ink-muted sm:text-left">
              Negociação direta com o vendedor. O {SITE.name} não intermedeia pagamentos.
            </p>
          </div>

          {/* Bloco do vendedor */}
          <div className="mt-4 rounded-lg border border-line bg-white p-5 shadow-card">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">
              Vendedor
            </h2>
            <div className="mt-3 flex items-center gap-3">
              <div className="relative size-12 shrink-0 overflow-hidden rounded-full bg-brand-100">
                {listing.sellerPhotoUrl ? (
                  <Image
                    src={listing.sellerPhotoUrl}
                    alt={sellerName}
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-lg font-bold text-brand-700">
                    {sellerName.charAt(0)}
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="flex flex-wrap items-center gap-2 text-sm font-bold text-ink">
                  <span className="truncate">{sellerName}</span>
                  {listing.sellerVerified && <VerifiedBadge />}
                </p>
                <p className="text-xs text-ink-muted">
                  {formatLocation(listing.sellerCity, listing.sellerState)} · no {SITE.name}{" "}
                  {timeAgo(listing.sellerCreatedAt)}
                </p>
              </div>
            </div>
            {listing.sellerDescription && (
              <p className="mt-3 line-clamp-3 text-xs leading-relaxed text-ink-muted">
                {listing.sellerDescription}
              </p>
            )}
            {listing.sellerSlug && (
              <Link
                href={`/vendedor/${listing.sellerSlug}`}
                className="mt-3 inline-block text-sm font-semibold text-brand-700 hover:underline"
              >
                Ver todos os anúncios deste vendedor →
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Vendido: outros anúncios do mesmo vendedor primeiro */}
      {sold && sellerOthers.length > 0 && (
        <section className="mt-10" aria-label="Outros anúncios deste vendedor">
          <h2 className="mb-4 text-lg font-bold text-ink">
            Disponíveis agora com {sellerName}
          </h2>
          <ListingGrid listings={sellerOthers} />
        </section>
      )}

      {similar.length > 0 && (
        <section className="mt-10" aria-label="Anúncios similares">
          <h2 className="mb-4 text-lg font-bold text-ink">Similares em {catName}</h2>
          <ListingGrid listings={similar} />
        </section>
      )}
    </main>
  );
}
