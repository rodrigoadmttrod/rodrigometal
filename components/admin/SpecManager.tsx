"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Spec {
  id: string;
  specKey: string;
  label: string;
  unit: string | null;
  isRequired: boolean;
  sortOrder: number;
}

export function SpecManager({
  categoryId,
  initialSpecs,
}: {
  categoryId: string;
  initialSpecs: Spec[];
}) {
  const router = useRouter();
  const [specs, setSpecs] = useState(initialSpecs);
  const [showForm, setShowForm] = useState(false);
  const [editingSpec, setEditingSpec] = useState<Spec | null>(null);
  const [loading, setLoading] = useState(false);

  // Form state
  const [specKey, setSpecKey] = useState("");
  const [label, setLabel] = useState("");
  const [unit, setUnit] = useState("");
  const [isRequired, setIsRequired] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function resetForm() {
    setSpecKey("");
    setLabel("");
    setUnit("");
    setIsRequired(false);
    setEditingSpec(null);
    setError(null);
    setShowForm(false);
  }

  function startEdit(spec: Spec) {
    setEditingSpec(spec);
    setSpecKey(spec.specKey);
    setLabel(spec.label);
    setUnit(spec.unit ?? "");
    setIsRequired(spec.isRequired);
    setShowForm(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const body = {
      specKey,
      label,
      unit: unit || null,
      isRequired,
    };

    const url = editingSpec
      ? `/api/admin/categories/${categoryId}/specs/${editingSpec.id}`
      : `/api/admin/categories/${categoryId}/specs`;

    const res = await fetch(url, {
      method: editingSpec ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Erro ao salvar spec");
      setLoading(false);
      return;
    }

    resetForm();
    router.refresh();
    setLoading(false);
  }

  async function handleDelete(specId: string) {
    if (!confirm("Remover esta especificação?")) return;
    setLoading(true);
    const res = await fetch(`/api/admin/categories/${categoryId}/specs/${specId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <div className="space-y-4">
      {/* Specs list */}
      <div className="rounded-2xl border border-border bg-card shadow-card overflow-hidden">
        {specs.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="text-sm text-ink-muted mb-4">Nenhuma spec definida ainda.</p>
            <button
              onClick={() => setShowForm(true)}
              className="rounded-xl bg-accent px-5 py-2.5 text-sm font-bold text-white transition-all hover:brightness-110 active:scale-[0.98]"
            >
              + Adicionar primeira spec
            </button>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {specs.map((spec, i) => (
              <div key={spec.id} className="flex items-center gap-4 px-5 py-3">
                <span className="text-xs font-mono text-ink-muted w-6">{i + 1}.</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-ink">{spec.label}</p>
                    {spec.isRequired && (
                      <span className="text-xs rounded bg-red-50 text-red-600 px-1.5 py-0.5">obrigatório</span>
                    )}
                  </div>
                  <p className="text-xs text-ink-muted font-mono mt-0.5">
                    {spec.specKey}
                    {spec.unit && ` · unidade: ${spec.unit}`}
                  </p>
                </div>
                <button
                  onClick={() => startEdit(spec)}
                  className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-ink hover:bg-surface transition-colors"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(spec.id)}
                  disabled={loading}
                  className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
                >
                  Remover
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {specs.length > 0 && !showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-bold text-ink hover:bg-surface transition-colors"
        >
          + Adicionar spec
        </button>
      )}

      {/* Add/Edit form */}
      {showForm && (
        <form onSubmit={handleSave} className="rounded-2xl border border-border bg-card p-5 shadow-card space-y-4">
          <h3 className="font-heading text-lg font-bold text-ink">
            {editingSpec ? "Editar spec" : "Nova spec"}
          </h3>

          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-ink mb-1.5">Nome de exibição</label>
              <input
                type="text"
                required
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                placeholder="Ex: Potência"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-ink mb-1.5">Chave técnica</label>
              <input
                type="text"
                required
                value={specKey}
                onChange={(e) => setSpecKey(e.target.value.toLowerCase().replace(/[^a-z0-9_]+/g, "_"))}
                className="w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-mono text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                placeholder="potencia"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-ink mb-1.5">Unidade (opcional)</label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                placeholder="Ex: kW, RPM, mm"
              />
            </div>
            <div>
              <label className="flex items-center gap-3 cursor-pointer mt-7">
                <input
                  type="checkbox"
                  checked={isRequired}
                  onChange={(e) => setIsRequired(e.target.checked)}
                  className="size-5 rounded-lg border-border accent-accent"
                />
                <span className="text-sm font-semibold text-ink">Obrigatório</span>
              </label>
              <p className="text-xs text-ink-muted mt-1">Deixe desmarcado na maioria dos casos</p>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-accent px-5 py-2.5 text-sm font-bold text-white transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
            >
              {loading ? "Salvando..." : editingSpec ? "Salvar" : "Adicionar"}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="rounded-xl border border-border px-5 py-2.5 text-sm font-semibold text-ink hover:bg-surface transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
