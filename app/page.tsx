import Link from "next/link";
import type { Metadata } from "next";
import Image from "next/image";
import { getHomeData } from "@/lib/queries/home";
import { ListingGrid } from "@/components/ListingGrid";
import { SellerCard } from "@/components/SellerCard";
import { SITE } from "@/lib/site";

// ISR: home revalida a cada 1 hora (spec 4.3)
export const revalidate = 3600;

export const metadata: Metadata = {
  title: `${SITE.name} — ${SITE.tagline}`,
  description: SITE.description,
  alternates: { canonical: "/" },
  openGraph: {
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
    type: "website",
    images: [{ url: "/seed/galpao-industrial-hero.jpg", width: 1200, height: 630, alt: "Galpão industrial com equipamentos usados — Rodrigometal" }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
    images: ["/seed/galpao-industrial-hero.jpg"],
  },
};

const CATEGORY_IMAGES: Record<string, string> = {
  "sucata-metalica": "/seed/sucata-patio-aco.webp",
  maquinas: "/seed/torno-mecanico-oficina.jpg",
  redutores: "/seed/redutor-rosca-sem-fim-azul.jpg",
  "motores-eletricos": "/seed/motor-weg-azul.jpg",
  bombas: "/seed/bomba-centrifuga-grande.jpg",
  ventiladores: "/seed/fabrica-interior.jpg",
  caldeiras: "/seed/galpao-industrial-hero.jpg",
  rolamentos: "/seed/motor-grande-azul.jpg",
  "equipamentos-industriais": "/seed/motores-galpao-pallets.jpg",
};

// Ordem de exibição das categorias nas bolinhas
const CATEGORY_ORDER = [
  "sucata-metalica",
  "maquinas",
  "redutores",
  "motores-eletricos",
  "bombas",
  "ventiladores",
  "caldeiras",
  "rolamentos",
  "equipamentos-industriais",
];

export default async function HomePage() {
  const { categories, recentListings, featuredSellers } = await getHomeData();

  return (
    <div className="mx-auto max-w-7xl px-4">
      {/* Hero compacto com foto de galpão industrial */}
      <section className="relative mt-4 overflow-hidden rounded-2xl">
        <Image
          src="/seed/galpao-industrial-hero.jpg"
          alt=""
          fill
          priority
          sizes="(max-width: 1280px) 100vw, 1248px"
          className="object-cover"
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-black/60" aria-hidden="true" />
        <div className="relative px-6 py-5 text-white md:px-10 md:py-6">
          <h1 className="max-w-2xl text-xl font-extrabold leading-tight md:text-2xl">
            Máquinas e equipamentos industriais usados, direto com o vendedor
          </h1>
          <p className="mt-1.5 max-w-xl text-sm text-white/90">
            Motores, redutores, bombas, tornos e sucata metálica. Anuncie grátis e negocie pelo WhatsApp.
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            <Link
              href="/painel/anunciar"
              className="rounded-xl bg-accent px-5 py-2 text-sm font-bold text-white hover:bg-accent-dark btn-press"
            >
              Anunciar grátis
            </Link>
            <Link
              href="/buscar"
              className="rounded-xl border border-white/50 bg-white/10 px-5 py-2 text-sm font-bold text-white hover:bg-white/20 btn-press"
            >
              Ver anúncios
            </Link>
          </div>
        </div>
      </section>

      {/* Categorias como bolinhas redondas em carrossel horizontal (SEO-safe) */}
      <section className="mt-8" aria-labelledby="h-categorias">
        <div className="flex items-center justify-between">
          <h2 id="h-categorias" className="text-xl font-bold text-ink">
            Categorias
          </h2>
          <span className="flex items-center gap-1 text-xs text-ink-muted">
            <svg viewBox="0 0 16 16" fill="currentColor" className="size-3.5" aria-hidden="true">
              <path d="M5 2L1 8l4 6" />
            </svg>
            <span className="sr-only">deslize para ver mais categorias</span>
            <svg viewBox="0 0 16 16" fill="currentColor" className="size-3.5" aria-hidden="true">
              <path d="M11 2l4 6-4 6" />
            </svg>
          </span>
        </div>
        <div
          className="mt-4 flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory
                     [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {categories.map((c) => (
            <Link
              key={c.slug}
              href={`/categoria/${c.slug}`}
              className="card-lift group flex shrink-0 snap-start flex-col items-center gap-2"
            >
              <div className="relative size-24 overflow-hidden rounded-full border-2 border-line bg-surface-muted shadow-card transition-transform duration-200 group-hover:scale-105 sm:size-20">
                <Image
                  src={CATEGORY_IMAGES[c.slug] ?? "/seed/fabrica-interior.jpg"}
                  alt={c.name}
                  fill
                  sizes="96px"
                  className="object-cover"
                />
              </div>
              <span className="text-center text-xs font-semibold leading-tight text-ink">
                {c.name}
              </span>
              <span className="text-[10px] text-ink-muted">
                {c.activeCount} anúncio{c.activeCount === 1 ? "" : "s"}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Anúncios recentes */}
      <section className="mt-10" aria-labelledby="h-recentes">
        <div className="flex items-baseline justify-between">
          <h2 id="h-recentes" className="text-xl font-bold text-ink">
            Anúncios recentes
          </h2>
          <Link href="/buscar" className="text-sm font-semibold text-brand-700 hover:underline">
            Ver todos →
          </Link>
        </div>
        <div className="mt-3">
          <ListingGrid
            listings={recentListings.map((l) => ({
              slug: l.slug,
              title: l.title,
              city: l.city,
              state: l.state,
              price: l.price,
              priceOnRequest: l.priceOnRequest,
              status: l.status,
              createdAt: l.createdAt,
              coverUrl: l.coverUrl,
              coverAlt: l.coverAlt,
              sellerName: l.sellerName,
            }))}
            emptyMessage="Ainda não há anúncios publicados. Seja o primeiro a anunciar!"
          />
        </div>
      </section>

      {/* Vendedores em destaque — credibilidade (persona 3.3) */}
      <section className="mt-10" aria-labelledby="h-vendedores">
        <h2 id="h-vendedores" className="text-xl font-bold text-ink">
          Vendedores no Rodrigometal
        </h2>
        <div
          className="mt-4 flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory
                     [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden
                     sm:grid sm:grid-cols-2 sm:gap-5 sm:overflow-visible sm:snap-none lg:grid-cols-3"
        >
          {featuredSellers.map((s) => (
            <SellerCard
              key={s.id}
              seller={{
                slug: s.slug,
                companyName: s.companyName,
                city: s.city,
                state: s.state,
                description: s.description,
                photoUrl: s.photoUrl,
                isVerified: s.isVerified,
                activeCount: Number(s.activeCount),
                listingPhotoUrl: s.listingPhotoUrl,
                listingPhotoAlt: s.listingPhotoAlt,
                sellerCategories: s.sellerCategories,
              }}
            />
          ))}
        </div>
      </section>

      {/* Bloco de confiança — auditor de credibilidade */}
      <section className="mt-10 mb-4 rounded-2xl border border-line bg-white p-6 md:p-8" aria-labelledby="h-como-funciona">
        <h2 id="h-como-funciona" className="text-xl font-bold text-ink">
          Como funciona o {SITE.name}
        </h2>
        <div className="mt-4 grid gap-6 sm:grid-cols-3">
          <div>
            <p className="text-sm font-bold text-accent-dark">1. O vendedor anuncia grátis</p>
            <p className="mt-1 text-sm leading-relaxed text-ink-muted">
              Publicar não custa nada e não tem limite. Fotos, ficha técnica e localização em poucos minutos.
            </p>
          </div>
          <div>
            <p className="text-sm font-bold text-accent-dark">2. O comprador encontra</p>
            <p className="mt-1 text-sm leading-relaxed text-ink-muted">
              Busca por categoria, cidade e especificação técnica. Cada anúncio tem ficha completa e fotos reais.
            </p>
          </div>
          <div>
            <p className="text-sm font-bold text-accent-dark">3. Negociam direto no WhatsApp</p>
            <p className="mt-1 text-sm leading-relaxed text-ink-muted">
              Sem intermediário e sem taxa sobre a venda. O contato vai direto para o WhatsApp do vendedor.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
