"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

type Props = {
  basePath: string;
  states: { value: string; label: string }[];
};

export function FilterBar({ basePath, states }: Props) {
  const router = useRouter();
  const sp = useSearchParams();

  const update = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(sp?.toString() || "");
      if (value) params.set(key, value);
      else params.delete(key);
      // reset page on filter change
      if (key !== "page") params.delete("page");
      const qs = params.toString();
      router.push(qs ? `${basePath}?${qs}` : basePath);
    },
    [router, sp, basePath]
  );

  const state = sp?.get("estado") ?? "";
  const minPrice = sp?.get("min") ?? "";
  const maxPrice = sp?.get("max") ?? "";

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-line bg-white p-4 shadow-card">
      <label className="flex flex-col gap-1 text-xs font-semibold text-ink-muted">
        Estado
        <select
          value={state}
          onChange={(e) => update("estado", e.target.value)}
          className="rounded-xl border border-line bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent/40"
        >
          <option value="">Todos</option>
          {states.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-xs font-semibold text-ink-muted">
        Preço mín. (R$)
        <input
          type="number"
          min={0}
          value={minPrice}
          onChange={(e) => update("min", e.target.value)}
          placeholder="0"
          className="w-28 rounded-xl border border-line bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent/40"
        />
      </label>
      <label className="flex flex-col gap-1 text-xs font-semibold text-ink-muted">
        Preço máx. (R$)
        <input
          type="number"
          min={0}
          value={maxPrice}
          onChange={(e) => update("max", e.target.value)}
          placeholder="∞"
          className="w-28 rounded-xl border border-line bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent/40"
        />
      </label>
      {(state || minPrice || maxPrice) && (
        <button
          onClick={() => router.push(basePath)}
          className="ml-auto rounded-xl border border-line px-3 py-2 text-sm font-semibold text-ink-muted hover:bg-surface-muted"
        >
          Limpar filtros
        </button>
      )}
    </div>
  );
}
