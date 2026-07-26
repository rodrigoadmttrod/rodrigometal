"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Listing = {
  id: string;
  title: string;
  description: string | null;
  categoryId: string | null;
  slug: string;
  price: string | null;
  priceOnRequest: boolean;
  itemCondition: string | null;
  city: string | null;
  state: string | null;
  status: string;
};

type Spec = { id: string; specKey: string; value: string; unit: string | null };
type Image = { id: string; url: string; sortOrder: number; altText: string | null };
type Category = { id: string; name: string; slug: string };

type Props = {
  listing: Listing;
  specs: Spec[];
  images: Image[];
  categories: Category[];
  adminId: string;
};

const STATUS_OPTIONS = [
  { value: "draft", label: "Rascunho" },
  { value: "active", label: "Ativo" },
  { value: "paused", label: "Pausado" },
  { value: "sold", label: "Vendido" },
  { value: "archived", label: "Arquivado" },
];

const CONDITION_OPTIONS = [
  { value: "new", label: "Novo" },
  { value: "used_good", label: "Usado — bom estado" },
  { value: "used_fair", label: "Usado — estado regular" },
  { value: "scrap", label: "Sucata / para reparo" },
];

const UF_OPTIONS = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];

export function AdminListingEditor({ listing, specs, images, categories, adminId }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState(listing.title);
  const [description, setDescription] = useState(listing.description || "");
  const [categoryId, setCategoryId] = useState(listing.categoryId || "");
  const [price, setPrice] = useState(listing.price || "");
  const [priceOnRequest, setPriceOnRequest] = useState(listing.priceOnRequest);
  const [itemCondition, setItemCondition] = useState(listing.itemCondition);
  const [city, setCity] = useState(listing.city || "");
  const [state, setState] = useState(listing.state || "");
  const [status, setStatus] = useState(listing.status);
  const [specRows, setSpecRows] = useState(specs.map((s) => ({ id: s.id, specKey: s.specKey, value: s.value, unit: s.unit || "" })));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const updateSpec = (idx: number, field: "specKey" | "value" | "unit", value: string) => {
    setSpecRows((prev) => prev.map((s, i) => (i === idx ? { ...s, [field]: value } : s)));
  };

  const addSpec = () => {
    setSpecRows((prev) => [...prev, { id: "", specKey: "", value: "", unit: "" }]);
  };

  const removeSpec = (idx: number) => {
    setSpecRows((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess(false);
    try {
      const res = await fetch(`/api/admin/listings/${listing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          categoryId: categoryId || null,
          price: priceOnRequest ? null : price,
          priceOnRequest,
          itemCondition,
          city,
          state,
          status,
          specs: specRows.filter((s) => s.specKey.trim() && s.value.trim()),
          adminId,
        }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error || "Erro ao salvar");
      } else {
        setSuccess(true);
        router.refresh();
      }
    } catch {
      setError("Erro de conexão");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-sm">
          Alterações salvas com sucesso.
        </div>
      )}

      {/* Images preview (read-only in admin) */}
      {images.length > 0 && (
        <div className="bg-card rounded-2xl border border-border shadow-card p-5">
          <h3 className="font-heading text-base font-bold text-ink mb-3">Fotos ({images.length})</h3>
          <div className="flex flex-wrap gap-3">
            {images.map((img) => (
              <div key={img.id} className="w-24 h-24 rounded-xl overflow-hidden bg-surface">
                <img src={img.url} alt={img.altText || ""} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Basic info */}
      <div className="bg-card rounded-2xl border border-border shadow-card p-5">
        <h3 className="font-heading text-base font-bold text-ink mb-4">Informações básicas</h3>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-ink-muted mb-1 block">Título</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-ink-muted mb-1 block">Descrição</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              className="w-full rounded-xl border border-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent resize-y"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-ink-muted mb-1 block">Categoria</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full rounded-xl border border-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent bg-white"
              >
                <option value="">Sem categoria</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-ink-muted mb-1 block">Condição</label>
              <select
                value={itemCondition ?? ""}
                onChange={(e) => setItemCondition(e.target.value)}
                className="w-full rounded-xl border border-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent bg-white"
              >
                {CONDITION_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Price + Location */}
      <div className="bg-card rounded-2xl border border-border shadow-card p-5">
        <h3 className="font-heading text-base font-bold text-ink mb-4">Preço e localização</h3>
        <div className="space-y-4">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={priceOnRequest}
              onChange={(e) => setPriceOnRequest(e.target.checked)}
              className="w-5 h-5 rounded accent-orange-500"
            />
            <span className="text-sm text-ink">Preço a combinar</span>
          </label>
          {!priceOnRequest && (
            <div>
              <label className="text-xs font-semibold text-ink-muted mb-1 block">Preço (R$)</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                step="0.01"
                className="w-full max-w-xs rounded-xl border border-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          )}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="text-xs font-semibold text-ink-muted mb-1 block">Cidade</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full rounded-xl border border-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-ink-muted mb-1 block">UF</label>
              <select
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full rounded-xl border border-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent bg-white"
              >
                <option value="">--</option>
                {UF_OPTIONS.map((uf) => (
                  <option key={uf} value={uf}>{uf}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Specs */}
      <div className="bg-card rounded-2xl border border-border shadow-card p-5">
        <h3 className="font-heading text-base font-bold text-ink mb-4">Ficha técnica</h3>
        <div className="space-y-2">
          {specRows.map((spec, idx) => (
            <div key={idx} className="flex gap-2 items-center">
              <input
                type="text"
                value={spec.specKey}
                onChange={(e) => updateSpec(idx, "specKey", e.target.value)}
                placeholder="Especificação"
                className="flex-1 rounded-xl border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
              <input
                type="text"
                value={spec.value}
                onChange={(e) => updateSpec(idx, "value", e.target.value)}
                placeholder="Valor"
                className="flex-1 rounded-xl border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
              <input
                type="text"
                value={spec.unit}
                onChange={(e) => updateSpec(idx, "unit", e.target.value)}
                placeholder="Unidade"
                className="w-24 rounded-xl border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
              <button
                type="button"
                onClick={() => removeSpec(idx)}
                className="w-8 h-8 rounded-lg bg-surface text-ink-muted hover:bg-red-50 hover:text-red-600 transition-colors text-sm"
              >
                ×
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addSpec}
            className="text-accent text-sm font-semibold hover:underline"
          >
            + Adicionar especificação
          </button>
        </div>
      </div>

      {/* Status */}
      <div className="bg-card rounded-2xl border border-border shadow-card p-5">
        <h3 className="font-heading text-base font-bold text-ink mb-4">Status do anúncio</h3>
        <div className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setStatus(opt.value)}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
                status === opt.value
                  ? "bg-accent text-white"
                  : "bg-surface text-ink-muted hover:bg-accent/10"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-ink-muted mt-3">
          Arquivar esconde o anúncio sem deletá-lo. Nenhum dado é removido.
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex-1 rounded-xl bg-accent px-6 py-3 text-sm font-bold text-white transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
        >
          {saving ? "Salvando..." : "Salvar alterações"}
        </button>
        <a
          href="/admin/anuncios"
          className="rounded-xl border border-border px-6 py-3 text-sm font-bold text-ink hover:bg-surface transition-colors"
        >
          Cancelar
        </a>
      </div>
    </div>
  );
}
