"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  listingId: string;
  status: string;
};

export function EditActions({ listingId, status }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState("");
  const [confirmArchive, setConfirmArchive] = useState(false);

  const doAction = async (action: string, label: string) => {
    setLoading(label);
    try {
      const res = await fetch("/api/listing/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId, action }),
      });
      const data = await res.json();
      if (data.ok) {
        router.refresh();
      }
    } catch {
      // ignore
    } finally {
      setLoading("");
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        {status === "paused" && (
          <button
            onClick={() => doAction("resume", "resume")}
            disabled={loading === "resume"}
            className="rounded-xl bg-green-600 px-5 py-2.5 text-sm font-bold text-white hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {loading === "resume" ? "Reativando..." : "Reativar anúncio"}
          </button>
        )}

        {status === "active" && (
          <button
            onClick={() => doAction("pause", "pause")}
            disabled={loading === "pause"}
            className="rounded-xl bg-yellow-500 px-5 py-2.5 text-sm font-bold text-white hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {loading === "pause" ? "Pausando..." : "Pausar anúncio"}
          </button>
        )}

        {(status === "active" || status === "paused") && (
          <button
            onClick={() => doAction("mark_sold", "sold")}
            disabled={loading === "sold"}
            className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {loading === "sold" ? "Marcando..." : "Marcar como vendido"}
          </button>
        )}

        {status === "sold" && (
          <button
            onClick={() => doAction("resume", "resume")}
            disabled={loading === "resume"}
            className="rounded-xl bg-green-600 px-5 py-2.5 text-sm font-bold text-white hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {loading === "resume" ? "Reativando..." : "Reativar (voltou do vendido)"}
          </button>
        )}
      </div>

      {/* Archive (soft delete) */}
      {status !== "archived" && (
        <div className="pt-4 border-t border-border">
          {!confirmArchive ? (
            <button
              onClick={() => setConfirmArchive(true)}
              className="text-sm text-ink-muted hover:text-red-600 transition-colors"
            >
              Arquivar anúncio
            </button>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-ink-muted">
                Arquivar remove o anúncio das listagens e do sitemap, mas a página continua acessível (não gera 404). Esta ação não pode ser desfeita.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => doAction("archive", "archive")}
                  disabled={loading === "archive"}
                  className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-bold text-white hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {loading === "archive" ? "Arquivando..." : "Confirmar arquivamento"}
                </button>
                <button
                  onClick={() => setConfirmArchive(false)}
                  className="rounded-xl border border-border px-5 py-2.5 text-sm font-bold text-ink hover:bg-surface transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {status === "archived" && (
        <div className="pt-4 border-t border-border">
          <button
            onClick={() => doAction("resume", "resume")}
            disabled={loading === "resume"}
            className="rounded-xl bg-green-600 px-5 py-2.5 text-sm font-bold text-white hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {loading === "resume" ? "Reativando..." : "Reativar anúncio arquivado"}
          </button>
        </div>
      )}
    </div>
  );
}
