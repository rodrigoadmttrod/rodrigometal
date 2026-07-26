import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/session";
import { redirect } from "next/navigation";
import Link from "next/link";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/painel/entrar?callbackUrl=/admin");
  if (user.role !== "admin") redirect("/");

  return (
    <div className="min-h-screen bg-page">
      {/* ADM Header */}
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="mx-auto max-w-7xl px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="font-heading text-lg font-bold">
              <span className="text-ink">RODRIGO</span>
              <span className="text-accent">METAL</span>
              <span className="ml-2 text-xs font-semibold rounded bg-accent/10 text-accent px-2 py-0.5">ADM</span>
            </Link>
            <nav className="hidden sm:flex items-center gap-1 text-sm">
              <Link href="/admin/categorias" className="rounded-lg px-3 py-1.5 text-ink-muted hover:bg-surface hover:text-ink transition-colors">
                Categorias
              </Link>
              <Link href="/admin/usuarios" className="rounded-lg px-3 py-1.5 text-ink-muted hover:bg-surface hover:text-ink transition-colors">
                Usuários
              </Link>
              <Link href="/admin/anuncios" className="rounded-lg px-3 py-1.5 text-ink-muted hover:bg-surface hover:text-ink transition-colors">
                Anúncios
              </Link>
              <Link href="/admin/auditoria" className="rounded-lg px-3 py-1.5 text-ink-muted hover:bg-surface hover:text-ink transition-colors">
                Auditoria
              </Link>
              <Link href="/admin/compartilhar" className="rounded-lg px-3 py-1.5 text-accent font-semibold hover:bg-accent/10 transition-colors">
                Compartilhar
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/" className="text-sm text-ink-muted hover:text-ink transition-colors">
              Ver site →
            </Link>
            <Link href="/painel" className="text-sm text-ink-muted hover:text-ink transition-colors">
              Meu painel
            </Link>
          </div>
        </div>
        {/* Mobile nav */}
        <nav className="sm:hidden flex items-center gap-1 px-4 pb-2 text-sm overflow-x-auto">
          <Link href="/admin/categorias" className="rounded-lg px-3 py-1.5 text-ink-muted hover:bg-surface hover:text-ink transition-colors shrink-0">
            Categorias
          </Link>
          <Link href="/admin/usuarios" className="rounded-lg px-3 py-1.5 text-ink-muted hover:bg-surface hover:text-ink transition-colors shrink-0">
            Usuários
          </Link>
          <Link href="/admin/anuncios" className="rounded-lg px-3 py-1.5 text-ink-muted hover:bg-surface hover:text-ink transition-colors shrink-0">
            Anúncios
          </Link>
          <Link href="/admin/auditoria" className="rounded-lg px-3 py-1.5 text-ink-muted hover:bg-surface hover:text-ink transition-colors shrink-0">
            Auditoria
          </Link>
          <Link href="/admin/compartilhar" className="rounded-lg px-3 py-1.5 text-accent font-semibold hover:bg-accent/10 transition-colors shrink-0">
            Compartilhar
          </Link>
        </nav>
      </header>
      <main>{children}</main>
    </div>
  );
}
