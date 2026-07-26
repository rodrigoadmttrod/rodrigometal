import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ListingGrid } from "@/components/ListingGrid";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { VerifiedBadge } from "@/components/badges";
import { getSellerBySlug } from "@/lib/queries/seller";
import { formatLocation, timeAgo } from "@/lib/format";
import { SITE } from "@/lib/site";

// ~6h como as demais páginas de conteúdo estável (spec 4.3)
export const revalidate = 21600;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await getSellerBySlug(slug);
  if (!data) return { title: "Vendedor não encontrado" };
  const name = data.seller.companyName ?? data.seller.name ?? "Vendedor";
  const loc = formatLocation(data.seller.city, data.seller.state);
  return {
    title: `${name} — anúncios em ${loc}`,
    description: `${data.active.length} anúncios ativos de ${name} no ${SITE.name}. ${data.seller.description ?? ""}`.trim(),
    alternates: { canonical: `/vendedor/${slug}` },
  };
}

export default async function SellerPage({ params }: Props) {
  const { slug } = await params;
  const data = await getSellerBySlug(slug);
  if (!data) notFound();

  const { seller, active, sold, contactCount, categories } = data;
  const name = seller.companyName ?? seller.name ?? "Vendedor";
  const catNames = categories.map((c) => c.name).join(", ");
  const memberSince = seller.createdAt
    ? new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(seller.createdAt)
    : null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <Breadcrumbs
        items={[
          { label: "Início", href: "/" },
          { label: "Vendedores" },
          { label: name },
        ]}
      />

      {/* Cabeçalho do vendedor */}
      <section className="mt-4 rounded-lg border border-line bg-white p-5 shadow-card md:p-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div className="flex gap-4">
            <div className="relative size-16 shrink-0 overflow-hidden rounded-full bg-brand-100 md:size-20">
              {seller.photoUrl ? (
                <Image src={seller.photoUrl} alt={name} fill sizes="80px" className="object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-2xl font-bold text-brand-700">
                  {name.charAt(0)}
                </div>
              )}
            </div>
            <div className="min-w-0">
              <h1 className="flex flex-wrap items-center gap-2 text-xl font-bold text-ink md:text-2xl">
                {name}
                {seller.isVerified && <VerifiedBadge />}
              </h1>
              <p className="mt-0.5 text-sm text-ink-muted">
                {formatLocation(seller.city, seller.state)}
                {memberSince && <> · no {SITE.name} desde {memberSince}</>}
              </p>
              {seller.description && (
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-muted">{seller.description}</p>
              )}
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm">
                <span className="font-semibold text-brand-700">
                  {active.length} anúncio{active.length === 1 ? "" : "s"} ativo{active.length === 1 ? "" : "s"}
                </span>
                {sold.length > 0 && (
                  <span className="font-semibold text-ink-muted">
                    {sold.length}+ vendido{sold.length === 1 ? "" : "s"} recentemente
                  </span>
                )}
                {contactCount > 0 && (
                  <span className="text-ink-muted">
                    {contactCount} contato{contactCount === 1 ? "" : "s"} recebido{contactCount === 1 ? "" : "s"}
                  </span>
                )}
              </div>
            </div>
          </div>

          {seller.phoneE164 && (
            <div className="shrink-0 md:w-64">
              <WhatsAppButton
                phoneE164={seller.phoneE164}
                message={`Olá! Vi sua vitrine no ${SITE.name} e tenho interesse${catNames ? ` em ${catNames.toLowerCase()}` : ""}.`}
                sellerId={seller.id}
                sourcePage={`/vendedor/${slug}`}
                size="lg"
                fixedOnMobile
                className="w-full"
              />
              <p className="mt-2 text-center text-xs text-ink-muted md:text-left">
                Negociação direta com o vendedor. O {SITE.name} não intermedeia pagamentos.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Anúncios ativos */}
      <section className="mt-8" aria-labelledby="h-ativos">
        <h2 id="h-ativos" className="mb-4 text-lg font-bold text-ink">
          Disponíveis agora ({active.length})
        </h2>
        <ListingGrid
          listings={active}
          emptyMessage={`Nenhum anúncio ativo no momento — mas ${name} costuma repor o estoque. Chame no WhatsApp e pergunte o que está chegando.`}
        />
      </section>

      {/* Vendidos recentemente — prova de giro */}
      {sold.length > 0 && (
        <section className="mt-10" aria-labelledby="h-vendidos">
          <h2 id="h-vendidos" className="text-lg font-bold text-ink">Vendidos recentemente</h2>
          <p className="mb-4 mt-1 text-sm text-ink-muted">
            Itens que giraram por aqui{sold[0]?.soldAt ? ` — o último ${timeAgo(sold[0].soldAt)}` : ""}. Procurando algo parecido? {name} costuma ter ou conseguir.
          </p>
          <ListingGrid listings={sold} />
        </section>
      )}
    </div>
  );
}
