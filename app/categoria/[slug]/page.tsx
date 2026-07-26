import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { FilterBar } from "@/components/FilterBar";
import { ListingGrid } from "@/components/ListingGrid";
import { Pagination } from "@/components/Pagination";
import { getCategoryBySlug, getCategoryListings, getCitiesByCategory, getAllCategorySlugs } from "@/lib/queries/category";
import { SITE } from "@/lib/site";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
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
  const { slug } = await params;
  const cat = await getCategoryBySlug(slug);
  if (!cat) return { title: "Categoria não encontrada" };
  return {
    title: `${cat.name} usados industriais`,
    description: cat.description ?? `Compre e venda ${cat.name} usados industriais. Anúncios direto com o vendedor pelo WhatsApp.`,
    alternates: { canonical: `/categoria/${slug}` },
  };
}

export async function generateStaticParams() {
  const slugs = await getAllCategorySlugs();
  return slugs.map((slug) => ({ slug }));
}

function single(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

function num(v: string | undefined): number | undefined {
  if (!v) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;
  const cat = await getCategoryBySlug(slug);
  if (!cat) notFound();

  const state = single(sp.estado);
  const city = single(sp.cidade);
  const minPrice = num(single(sp.min));
  const maxPrice = num(single(sp.max));
  const page = Math.max(1, num(single(sp.p)) ?? 1);

  const [data, cities] = await Promise.all([
    getCategoryListings({ categorySlug: slug, state, city, minPrice, maxPrice, page }),
    getCitiesByCategory(cat.id),
  ]);

  const extraParams: Record<string, string> = {};
  if (state) extraParams.estado = state;
  if (city) extraParams.cidade = city;
  if (minPrice != null) extraParams.min = String(minPrice);
  if (maxPrice != null) extraParams.max = String(maxPrice);

  const heading = city
    ? `${cat.name} em ${city}${state ? ` – ${state}` : ""}`
    : state
      ? `${cat.name} — ${STATES.find((s) => s.value === state)?.label ?? state}`
      : cat.name;

  return (
    <main className="container py-6">
      <Breadcrumbs
        items={[
          { label: "Início", href: "/" },
          { label: cat.name },
        ]}
      />

      <div className="mt-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">{heading}</h1>
          <p className="mt-1 text-sm text-ink-muted">
            {data.total} anúncio{data.total === 1 ? "" : "s"}{data.total > 0 ? ` · página ${page} de ${data.totalPages}` : ""}
          </p>
        </div>
      </div>

      {/* Navegação geográfica: cidades com anúncios nesta categoria */}
      {cities.length > 0 && !city && (
        <div className="mt-4 flex flex-wrap gap-2">
          {cities.slice(0, 12).map((c) => (
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
        <FilterBar basePath={`/categoria/${slug}`} states={STATES} />
      </div>

      <div className="mt-6">
        <ListingGrid
          listings={data.listings}
          emptyMessage={`Nenhum anúncio de ${cat.name.toLowerCase()} com esses filtros. Tente ampliar a busca ou volte em alguns dias — o catálogo cresce toda semana.`}
        />
      </div>

      <Pagination
        currentPage={page}
        totalPages={data.totalPages}
        basePath={`/categoria/${slug}`}
        extraParams={extraParams}
      />
    </main>
  );
}
