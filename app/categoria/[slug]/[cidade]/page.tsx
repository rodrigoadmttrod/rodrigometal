import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { FilterBar } from "@/components/FilterBar";
import { ListingGrid } from "@/components/ListingGrid";
import { Pagination } from "@/components/Pagination";
import { getCategoryBySlug, getCategoryListings, getCitiesByCategory } from "@/lib/queries/category";
import { SITE } from "@/lib/site";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string; cidade: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const STATES = [
  { value: "SP", label: "São Paulo" },
  { value: "MG", label: "Minas Gerais" },
  { value: "RS", label: "Rio Grande do Sul" },
  { value: "SC", label: "Santa Catarina" },
  { value: "PR", label: "Paraná" },
  { value: "PE", label: "Pernambuco" },
];

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, cidade } = await params;
  const cat = await getCategoryBySlug(slug);
  if (!cat) return { title: "Categoria não encontrada" };
  const title = `${cat.name} usados em ${cidade} | ${SITE.name}`;
  const description = `Compre e venda ${cat.name.toLowerCase()} usados e novos em ${cidade}. Negocie direto com o vendedor pelo WhatsApp, sem intermediação.`;
  return {
    title,
    description,
    alternates: { canonical: `/categoria/${slug}/${cidade}` },
    openGraph: { title, description },
  };
}

function single(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

function num(v: string | undefined): number | undefined {
  if (!v) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

export default async function CategoryCityPage({ params, searchParams }: Props) {
  const { slug, cidade } = await params;
  const sp = await searchParams;
  const cat = await getCategoryBySlug(slug);
  if (!cat) notFound();

  const minPrice = num(single(sp.min));
  const maxPrice = num(single(sp.max));
  const page = Math.max(1, num(single(sp.p)) ?? 1);

  // Detectar estado da cidade a partir dos anúncios
  const cities = await getCitiesByCategory(cat.id);
  const cityInfo = cities.find((c) => c.city === cidade);
  const state = cityInfo?.state ?? undefined;

  const data = await getCategoryListings({
    categorySlug: slug,
    city: cidade,
    state,
    minPrice,
    maxPrice,
    page,
  });

  const extraParams: Record<string, string> = {};
  if (minPrice != null) extraParams.min = String(minPrice);
  if (maxPrice != null) extraParams.max = String(maxPrice);

  const heading = `${cat.name} em ${cidade}${state ? ` – ${state}` : ""}`;

  return (
    <main className="container py-6">
      <Breadcrumbs
        items={[
          { label: "Início", href: "/" },
          { label: cat.name, href: `/categoria/${slug}` },
          { label: cidade },
        ]}
      />

      <div className="mt-4">
        <h1 className="text-2xl font-bold text-ink">{heading}</h1>
        <p className="mt-1 text-sm text-ink-muted">
          {data.total} anúncio{data.total === 1 ? "" : "s"}{data.total > 0 ? ` · página ${page} de ${data.totalPages}` : ""}
        </p>
      </div>

      {/* Outras cidades com anúncios nesta categoria */}
      {cities.length > 1 && (
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="text-xs font-semibold text-ink-muted">Outras cidades:</span>
          {cities
            .filter((c) => c.city !== cidade)
            .slice(0, 10)
            .map((c) => (
              <Link
                key={`${c.city}-${c.state}`}
                href={`/categoria/${slug}/${c.city}`}
                className="rounded-full border border-line bg-white px-3 py-1.5 text-xs font-semibold text-ink-muted hover:border-accent hover:text-accent"
              >
                {c.city} – {c.state} ({c.total})
              </Link>
            ))}
        </div>
      )}

      <div className="mt-5">
        <FilterBar basePath={`/categoria/${slug}/${cidade}`} states={STATES} />
      </div>

      <div className="mt-6">
        <ListingGrid
          listings={data.listings}
          emptyMessage={`Nenhum anúncio de ${cat.name.toLowerCase()} em ${cidade} no momento. Tente ampliar os filtros ou busque em cidades próximas.`}
        />
      </div>

      <Pagination
        currentPage={page}
        totalPages={data.totalPages}
        basePath={`/categoria/${slug}/${cidade}`}
        extraParams={extraParams}
      />
    </main>
  );
}
