import Link from "next/link";

const NAV = [
  { href: "/categoria/equipamentos-industriais", label: "Equipamentos industriais" },
  { href: "/categoria/maquinas", label: "Máquinas" },
  { href: "/categoria/sucata-metalica", label: "Sucata metálica" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-40 bg-white shadow-md">
      {/* Linha 1: logo + busca + CTA */}
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex h-14 items-center gap-4 md:h-16">
          <Link href="/" className="flex items-baseline shrink-0" aria-label="Rodrigometal — página inicial">
            <span className="font-heading text-xl font-extrabold tracking-tight text-brand-900 md:text-2xl">RODRIGO</span>
            <span className="font-heading text-xl font-extrabold tracking-tight text-accent md:text-2xl">METAL</span>
          </Link>

          <form action="/buscar" className="hidden md:flex flex-1 max-w-2xl" role="search">
            <input
              type="search"
              name="q"
              placeholder="Buscar motor, redutor, bomba, torno…"
              className="w-full rounded-l-xl border border-r-0 border-line bg-surface-muted px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-accent"
              aria-label="Buscar equipamentos"
            />
            <button
              type="submit"
              className="rounded-r-xl bg-accent px-4 text-sm font-bold text-white hover:bg-accent-dark btn-press"
            >
              Buscar
            </button>
          </form>

          <Link
            href="/painel/anunciar"
            className="ml-auto shrink-0 rounded-xl bg-accent px-3 py-2 text-sm font-bold text-white hover:bg-accent-dark btn-press"
          >
            Anunciar grátis
          </Link>
        </div>

        {/* busca mobile */}
        <form action="/buscar" className="md:hidden pb-2" role="search">
          <div className="flex">
            <input
              type="search"
              name="q"
              placeholder="Buscar motor, redutor, bomba…"
              className="w-full rounded-l-xl border border-r-0 border-line bg-surface-muted px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus:outline-none"
              aria-label="Buscar equipamentos"
            />
            <button type="submit" className="rounded-r-xl bg-accent px-4 text-sm font-bold text-white btn-press">
              Buscar
            </button>
          </div>
        </form>
      </div>

      {/* Linha 2: navegação por categorias */}
      <nav className="border-t border-line bg-surface overflow-x-auto" aria-label="Navegação principal">
        <div className="mx-auto flex max-w-7xl gap-1 px-2 py-1 whitespace-nowrap md:px-4">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="rounded-lg px-3 py-1.5 text-xs font-semibold text-brand-800 hover:bg-brand-50 hover:text-accent-dark md:text-sm transition-colors duration-150"
            >
              {n.label}
            </Link>
          ))}
          <Link
            href="/buscar"
            className="ml-auto rounded-lg px-3 py-1.5 text-xs font-semibold text-ink-muted hover:bg-brand-50 hover:text-accent-dark md:text-sm transition-colors duration-150"
          >
            Todos os anúncios
          </Link>
        </div>
      </nav>
    </header>
  );
}
