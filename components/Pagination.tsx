/** Paginação indexável: links <a href="?p=N"> estilizados como botões (spec 6.5). */
export function Pagination({
  currentPage,
  totalPages,
  basePath,
  extraParams = {},
}: {
  currentPage: number;
  totalPages: number;
  basePath: string;
  extraParams?: Record<string, string>;
}) {
  if (totalPages <= 1) return null;

  function href(p: number) {
    const params = new URLSearchParams(extraParams);
    if (p > 1) params.set("p", String(p));
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  }

  const pages: number[] = [];
  const start = Math.max(1, currentPage - 2);
  const end = Math.min(totalPages, currentPage + 2);
  for (let p = start; p <= end; p++) pages.push(p);

  const btn = "inline-flex min-w-10 items-center justify-center rounded-xl border px-3 py-2 text-sm font-semibold";

  return (
    <nav aria-label="Paginação" className="mt-8 flex flex-wrap items-center justify-center gap-2">
      {currentPage > 1 && (
        <a href={href(currentPage - 1)} className={`${btn} border-line bg-white text-ink hover:border-brand-600`} rel="prev">
          ← Anterior
        </a>
      )}
      {start > 1 && (
        <>
          <a href={href(1)} className={`${btn} border-line bg-white text-ink hover:border-brand-600`}>1</a>
          {start > 2 && <span className="px-1 text-ink-muted">…</span>}
        </>
      )}
      {pages.map((p) =>
        p === currentPage ? (
          <span key={p} aria-current="page" className={`${btn} border-brand-800 bg-brand-800 text-white`}>
            {p}
          </span>
        ) : (
          <a key={p} href={href(p)} className={`${btn} border-line bg-white text-ink hover:border-brand-600`}>
            {p}
          </a>
        )
      )}
      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span className="px-1 text-ink-muted">…</span>}
          <a href={href(totalPages)} className={`${btn} border-line bg-white text-ink hover:border-brand-600`}>
            {totalPages}
          </a>
        </>
      )}
      {currentPage < totalPages && (
        <a href={href(currentPage + 1)} className={`${btn} border-line bg-white text-ink hover:border-brand-600`} rel="next">
          Próxima →
        </a>
      )}
    </nav>
  );
}

