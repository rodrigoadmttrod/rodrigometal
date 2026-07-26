import Link from "next/link";
import { db } from "@/lib/db/client";
import { categories, users, listings, categorySpecs, auditLogs } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const [catCount] = await db.select({ count: sql`COUNT(*)` }).from(categories);
  const [userCount] = await db.select({ count: sql`COUNT(*)` }).from(users);
  const [listingCount] = await db.select({ count: sql`COUNT(*)` }).from(listings);
  const [specCount] = await db.select({ count: sql`COUNT(*)` }).from(categorySpecs);
  const [auditCount] = await db.select({ count: sql`COUNT(*)` }).from(auditLogs);

  const stats = [
    { label: "Categorias", value: catCount.count, href: "/admin/categorias", icon: "📁" },
    { label: "Specs no dicionário", value: specCount.count, href: "/admin/categorias", icon: "📋" },
    { label: "Usuários", value: userCount.count, href: "/admin/usuarios", icon: "👤" },
    { label: "Anúncios", value: listingCount.count, href: "/admin/anuncios", icon: "📦" },
    { label: "Registros de auditoria", value: auditCount.count, href: "/admin/auditoria", icon: "🔍" },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="font-heading text-2xl font-bold text-ink mb-2">Painel ADM</h1>
      <p className="text-sm text-ink-muted mb-8">Visão geral do sistema</p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="card-lift rounded-2xl border border-border bg-card p-5 shadow-card"
          >
            <p className="text-3xl font-extrabold text-ink">{s.value}</p>
            <p className="text-xs text-ink-muted mt-1">{s.label}</p>
          </Link>
        ))}
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Link
          href="/admin/categorias"
          className="card-lift rounded-2xl border border-border bg-card p-6 shadow-card"
        >
          <h2 className="font-heading text-lg font-bold text-ink">Gerenciar categorias</h2>
          <p className="text-sm text-ink-muted mt-1">Criar, editar, renomear e desativar categorias. Gerenciar specs de cada categoria.</p>
        </Link>
        <Link
          href="/admin/usuarios"
          className="card-lift rounded-2xl border border-border bg-card p-6 shadow-card"
        >
          <h2 className="font-heading text-lg font-bold text-ink">Gerenciar usuários</h2>
          <p className="text-sm text-ink-muted mt-1">Ver perfis, editar dados, ativar/desativar, gerenciar categorias e selo de verificação.</p>
        </Link>
        <Link
          href="/admin/anuncios"
          className="card-lift rounded-2xl border border-border bg-card p-6 shadow-card"
        >
          <h2 className="font-heading text-lg font-bold text-ink">Moderar anúncios</h2>
          <p className="text-sm text-ink-muted mt-1">Editar qualquer campo de qualquer anúncio, mudar status, arquivar. Override total do admin.</p>
        </Link>
        <Link
          href="/admin/auditoria"
          className="card-lift rounded-2xl border border-border bg-card p-6 shadow-card"
        >
          <h2 className="font-heading text-lg font-bold text-ink">Auditoria</h2>
          <p className="text-sm text-ink-muted mt-1">Log de todas as alterações feitas pelo admin: quem fez, quando, o que mudou.</p>
        </Link>
        <Link
          href="/admin/compartilhar"
          className="card-lift rounded-2xl border-2 border-accent/30 bg-accent/5 p-6 shadow-card"
        >
          <h2 className="font-heading text-lg font-bold text-accent">Compartilhar no Instagram</h2>
          <p className="text-sm text-ink-muted mt-1">Legenda e fotos prontas pra copiar e colar. Contador de compartilhamentos por anúncio.</p>
        </Link>
      </div>
    </div>
  );
}
