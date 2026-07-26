import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { FilterBar } from "@/components/FilterBar";
import { ListingGrid } from "@/components/ListingGrid";
import { Pagination } from "@/components/Pagination";
import { searchListings } from "@/lib/queries/category";
import { SITE } from "@/lib/site";

export const dynamic = "force-dynamic";

type Props = {
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

function single(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

function num(v: string | undefined): number | undefined {
  if (!v) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const sp = await searchParams;
  const q = single(sp.q) ?? "";
  if (!q) return { title: `Buscar | ${SITE.name}`, robots: { index: false, follow: true } };
  return {
    title: `"${q}" — buscar | ${SITE.name}`,
    description: `Resultados de busca para "${q}" no ${SITE.name}. Equipamentos industriais usados e novos, direto com o vendedor.`,
    robots: { index: false, follow: true },
  };
}

export default async function SearchPage({ searchParams }: Props) {
  const sp = await searchParams;
  const q = single(sp.q) ?? "";
  const state = single(sp.estado);
  const city = single(sp.cidade);
  const minPrice = num(single(sp.min));
  const maxPrice = num(single(sp.max));
  const categorySlug = single(sp.cat);
  const page = Math.max(1, num(single(sp.p)) ?? 1);

  const hasQuery = q.trim().length > 0;

  const data = hasQuery
    ? await searchListings({ q: q.trim(), state, city, minPrice, maxPrice, categorySlug, page })
    : { listings: [], total: 0, totalPages: 0, page, categoryId: undefined };

  const extraParams: Record<string, string> = {};
  if (q) extraParams.q = q;
  if (state) extraParams.estado = state;
  if (city) extraParams.cidade = city;
  if (minPrice != null) extraParams.min = String(minPrice);
  if (maxPrice != null) extraParams.max = String(maxPrice);
  if (categorySlug) extraParams.cat = categorySlug;

  return (
    <main className="container py-6">
      <Breadcrumbs
        items={[
          { label: "Início", href: "/" },
          { label: "Buscar" },
        ]}
      />

      <div className="mt-4">
        <h1 className="text-2xl font-bold text-ink">
          {hasQuery ? (
            <>Resultados para &ldquo;{q}&rdquo;</>
          ) : (
            "Buscar anúncios"
          )}
        </h1>
        {hasQuery && (
          <p className="mt-1 text-sm text-ink-muted">
            {data.total} resultado{data.total === 1 ? "" : "s"}{data.total > 0 ? ` · página ${page} de ${data.totalPages}` : ""}
          </p>
        )}
      </div>

      <div className="mt-5">
        <FilterBar basePath="/buscar" states={STATES} />
      </div>

      <div className="mt-6">
        {hasQuery ? (
          <ListingGrid
            listings={data.listings}
            emptyMessage={`Nenhum resultado para "${q}" com esses filtros. Tente termos mais amplos — ex: "motor" em vez de "motor WEG 50cv 4 polos".`}
          />
        ) : (
          <div className="rounded-lg border border-dashed border-line bg-surface-muted p-10 text-center text-sm text-ink-muted">
            Digite algo na busca acima — ex: motor, redutor, torno, bomba, sucata.
          </div>
        )}
      </div>

      {hasQuery && (
        <Pagination
          currentPage={page}
          totalPages={data.totalPages}
          basePath="/buscar"
          extraParams={extraParams}
        />
      )}
    </main>
  );
}
