"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface CategoryData {
  id?: string;
  name: string;
  slug: string;
  description: string | null;
  isActive: boolean;
}

export function CategoryForm({
  mode,
  category,
}: {
  mode: "create" | "edit";
  category?: CategoryData;
}) {
  const router = useRouter();
  const [name, setName] = useState(category?.name ?? "");
  const [slug, setSlug] = useState(category?.slug ?? "");
  const [description, setDescription] = useState(category?.description ?? "");
  const [isActive, setIsActive] = useState(category?.isActive ?? true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-generate slug from name
  function handleNameChange(val: string) {
    setName(val);
    if (mode === "create") {
      setSlug(
        val
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "")
      );
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const body = { name, slug, description, isActive };
    const url = mode === "create"
      ? "/api/admin/categories"
      : `/api/admin/categories/${category?.id}`;

    const res = await fetch(url, {
      method: mode === "create" ? "POST" : "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Erro ao salvar categoria");
      setLoading(false);
      return;
    }

    router.push("/admin/categorias");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-semibold text-ink mb-1.5">Nome</label>
        <input
          type="text"
          required
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          className="w-full rounded-xl border border-border bg-white px-4 py-3 text-base text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
          placeholder="Ex: Motores Elétricos"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-ink mb-1.5">Slug (URL)</label>
        <input
          type="text"
          required
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          className="w-full rounded-xl border border-border bg-white px-4 py-3 text-base font-mono text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
          placeholder="motores-eletricos"
        />
        <p className="text-xs text-ink-muted mt-1">URL da categoria: /categoria/{slug || "..."}</p>
      </div>

      <div>
        <label className="block text-sm font-semibold text-ink mb-1.5">Descrição (SEO)</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full rounded-xl border border-border bg-white px-4 py-3 text-base text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
          placeholder="Descrição para SEO e listagem da categoria"
        />
      </div>

      <div>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="size-5 rounded-lg border-border accent-accent"
          />
          <span className="text-sm font-semibold text-ink">Categoria ativa (visível no site)</span>
        </label>
      </div>

      <div className="flex items-center gap-3 pt-4">
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-accent px-6 py-3 text-sm font-bold text-white transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
        >
          {loading ? "Salvando..." : mode === "create" ? "Criar categoria" : "Salvar alterações"}
        </button>
        <Link
          href="/admin/categorias"
          className="rounded-xl border border-border px-6 py-3 text-sm font-semibold text-ink hover:bg-surface transition-colors"
        >
          Cancelar
        </Link>
      </div>
    </form>
  );
}
