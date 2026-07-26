"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type CategorySpec = { id: string; specKey: string; label: string; unit: string | null; isRequired: boolean; sortOrder: number };
type Category = { id: string; name: string; slug: string; specs?: CategorySpec[] };
type SpecRow = { specKey: string; value: string; unit: string };
type ImageRow = { url: string; altText?: string };

type Props = {
  categories: Category[];
  userCity?: string;
  userState?: string;
  initialData?: {
    id: string;
    title: string;
    description: string;
    categoryId: string;
    price: string;
    priceOnRequest: boolean;
    itemCondition: string;
    city: string;
    state: string;
    slug: string;
    status: string;
    images: ImageRow[];
    specs: SpecRow[];
  };
};

const CONDITION_OPTIONS = [
  { value: "new", label: "Novo" },
  { value: "used_good", label: "Usado — bom estado" },
  { value: "used_fair", label: "Usado — estado regular" },
  { value: "scrap", label: "Sucata / para reparo" },
];

const UF_OPTIONS = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];

export function ListingForm({ categories, userCity, userState, initialData }: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isEdit = !!initialData;
  const isDraft = initialData?.status === "draft";

  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [categoryId, setCategoryId] = useState(initialData?.categoryId || "");
  const [price, setPrice] = useState(initialData?.price || "");
  const [priceOnRequest, setPriceOnRequest] = useState(initialData?.priceOnRequest || false);
  const [itemCondition, setItemCondition] = useState(initialData?.itemCondition || "used_good");
  const [city, setCity] = useState(initialData?.city || userCity || "");
  const [state, setState] = useState(initialData?.state || userState || "");
  const [slug, setSlug] = useState(initialData?.slug || "");
  const [images, setImages] = useState<ImageRow[]>(initialData?.images || []);
  const [specs, setSpecs] = useState<SpecRow[]>(initialData?.specs || [{ specKey: "", value: "", unit: "" }]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // When category changes, load specs from the category dictionary
  const selectedCategory = categories.find((c) => c.id === categoryId);
  const categorySpecs = selectedCategory?.specs ?? [];

  const handleCategoryChange = (catId: string) => {
    setCategoryId(catId);
    const cat = categories.find((c) => c.id === catId);
    if (cat?.specs && cat.specs.length > 0) {
      // Pre-fill spec rows from the category dictionary
      const existingSpecs = specs.filter((s) => s.specKey.trim() && s.value.trim());
      const newSpecs = cat.specs.map((cs) => {
        const existing = existingSpecs.find((es) => es.specKey === cs.label || es.specKey === cs.specKey);
        return existing ?? { specKey: cs.label, value: "", unit: cs.unit ?? "" };
      });
      setSpecs(newSpecs);
    }
  };

  const handleUpload = useCallback(async (files: FileList) => {
    setUploading(true);
    setError("");
    try {
      const newImages: ImageRow[] = [];
      for (const file of Array.from(files)) {
        if (images.length + newImages.length >= 6) {
          setError("Máximo de 6 fotos");
          break;
        }
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        const data = await res.json();
        if (data.ok) {
          newImages.push({ url: data.url });
        } else {
          setError(data.error || "Erro no upload");
        }
      }
      setImages((prev) => [...prev, ...newImages]);
    } catch {
      setError("Erro ao enviar fotos");
    } finally {
      setUploading(false);
    }
  }, [images.length]);

  const removeImage = (idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const addSpec = () => {
    if (specs.length < 15) {
      setSpecs((prev) => [...prev, { specKey: "", value: "", unit: "" }]);
    }
  };

  const removeSpec = (idx: number) => {
    setSpecs((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateSpec = (idx: number, field: keyof SpecRow, value: string) => {
    setSpecs((prev) => prev.map((s, i) => (i === idx ? { ...s, [field]: value } : s)));
  };

  const handleSubmit = async (publish: boolean) => {
    setSaving(true);
    setError("");
    try {
      const payload = {
        title,
        description,
        categoryId,
        price: priceOnRequest ? null : price,
        priceOnRequest,
        itemCondition,
        city,
        state,
        slug: isDraft ? slug : undefined,
        images,
        specs: specs.filter((s) => s.specKey.trim() && s.value.trim()),
        publish,
      };

      const url = isEdit ? "/api/listing/update" : "/api/listing/create";
      const method = isEdit ? "PUT" : "POST";
      const body = isEdit ? { listingId: initialData!.id, ...payload } : payload;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!data.ok) {
        setError(data.error || "Erro ao salvar");
        setSaving(false);
        return;
      }

      router.push("/painel");
      router.refresh();
    } catch {
      setError("Erro de conexão");
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

      {/* Photos */}
      <Section title="Fotos" hint="Até 6 fotos. JPG, PNG ou WebP. Máximo 8MB cada.">
        <div className="flex flex-wrap gap-3">
          {images.map((img, idx) => (
            <div key={idx} className="relative w-24 h-24 rounded-xl overflow-hidden bg-surface group">
              <img src={img.url} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removeImage(idx)}
                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                ×
              </button>
            </div>
          ))}
          {images.length < 6 && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-24 h-24 rounded-xl border-2 border-dashed border-border flex items-center justify-center text-ink-muted hover:border-accent hover:text-accent transition-colors text-xs text-center px-2"
            >
              {uploading ? "Enviando..." : "+ Adicionar foto"}
            </button>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && handleUpload(e.target.files)}
        />
      </Section>

      {/* Basic info */}
      <Section title="Informações básicas">
        <Field label="Título do anúncio" required>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Motor elétrico WEG W22 50cv 4 polos"
            maxLength={300}
            className="w-full rounded-xl border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </Field>

        {isDraft && (
          <Field label="URL (slug)" hint="Você pode editar enquanto for rascunho. Depois de publicado, não pode mais mudar.">
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="Deixe vazio para gerar automaticamente do título"
              className="w-full rounded-xl border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </Field>
        )}

        <Field label="Descrição">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descreva o equipamento: modelo, ano, estado de conservação, acessórios inclusos..."
            rows={5}
            className="w-full rounded-xl border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent resize-y"
          />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Categoria">
            <select
              value={categoryId}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="w-full rounded-xl border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent bg-white"
            >
              <option value="">Selecione...</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </Field>

          <Field label="Condição">
            <select
              value={itemCondition}
              onChange={(e) => setItemCondition(e.target.value)}
              className="w-full rounded-xl border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent bg-white"
            >
              {CONDITION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </Field>
        </div>
      </Section>

      {/* Price */}
      <Section title="Preço">
        <label className="flex items-center gap-3 mb-4">
          <input
            type="checkbox"
            checked={priceOnRequest}
            onChange={(e) => setPriceOnRequest(e.target.checked)}
            className="w-5 h-5 rounded accent-orange-500"
          />
          <span className="text-sm text-ink">Preço a combinar</span>
        </label>
        {!priceOnRequest && (
          <Field label="Preço (R$)">
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0,00"
              min="0"
              step="0.01"
              className="w-full max-w-xs rounded-xl border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </Field>
        )}
      </Section>

      {/* Location */}
      <Section title="Localização">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Cidade" required>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Ex: Guarulhos"
              className="rounded-xl border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </Field>
          <Field label="UF" required>
            <select
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="rounded-xl border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent bg-white"
            >
              <option value="">--</option>
              {UF_OPTIONS.map((uf) => (
                <option key={uf} value={uf}>{uf}</option>
              ))}
            </select>
          </Field>
        </div>
      </Section>

      {/* Specs */}
      <Section title="Ficha técnica" hint={categorySpecs.length > 0 ? `Campos sugeridos para ${selectedCategory?.name}. Todos opcionais — preencha o que souber.` : "Especificações que o comprador procura: potência, tensão, rotação, etc."}>
        <div className="space-y-2">
          {specs.map((spec, idx) => {
            const catSpec = categorySpecs.find((cs) => cs.label === spec.specKey);
            const isFromDict = !!catSpec;
            return (
              <div key={idx} className="grid grid-cols-[1fr_1fr_auto] gap-2 sm:grid-cols-[1fr_1fr_6rem_auto] items-center">
                <input
                  type="text"
                  value={spec.specKey}
                  onChange={(e) => updateSpec(idx, "specKey", e.target.value)}
                  placeholder="Especificação (ex: Potência)"
                  readOnly={isFromDict}
                  className={`flex-1 rounded-xl border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent ${isFromDict ? "bg-surface text-ink-muted font-medium" : "bg-white"}`}
                />
                <input
                  type="text"
                  value={spec.value}
                  onChange={(e) => updateSpec(idx, "value", e.target.value)}
                  placeholder="Valor (ex: 50)"
                  className="flex-1 rounded-xl border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                />
                <input
                  type="text"
                  value={spec.unit}
                  onChange={(e) => updateSpec(idx, "unit", e.target.value)}
                  placeholder="Unidade"
                  readOnly={isFromDict && !!catSpec?.unit}
                  className={`hidden sm:block rounded-xl border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent ${isFromDict && catSpec?.unit ? "bg-surface text-ink-muted" : "bg-white"}`}
                />
                {specs.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeSpec(idx)}
                    className="w-8 h-8 rounded-lg bg-surface text-ink-muted hover:bg-red-50 hover:text-red-600 transition-colors text-sm"
                  >
                    ×
                  </button>
                )}
              </div>
            );
          })}
          {specs.length < 15 && (
            <button
              type="button"
              onClick={addSpec}
              className="text-accent text-sm font-semibold hover:underline"
            >
              + Adicionar especificação
            </button>
          )}
        </div>
      </Section>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <button
          type="button"
          onClick={() => handleSubmit(false)}
          disabled={saving}
          className="flex-1 rounded-xl border border-border px-6 py-3 text-sm font-bold text-ink hover:bg-surface transition-colors disabled:opacity-50"
        >
          Salvar rascunho
        </button>
        <button
          type="button"
          onClick={() => handleSubmit(true)}
          disabled={saving}
          className="flex-1 rounded-xl bg-accent px-6 py-3 text-sm font-bold text-white transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
        >
          {saving ? "Salvando..." : "Publicar anúncio"}
        </button>
      </div>

      <Link href="/painel" className="block text-center text-ink-muted text-sm hover:underline">
        ← Voltar para o painel
      </Link>
    </div>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="bg-card rounded-2xl shadow-card p-5">
      <h3 className="font-heading text-base font-bold text-ink mb-1">{title}</h3>
      {hint && <p className="text-xs text-ink-muted mb-4">{hint}</p>}
      <div className={hint ? "" : "mt-3"}>{children}</div>
    </div>
  );
}

function Field({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-semibold text-ink mb-1.5">
        {label} {required && <span className="text-accent">*</span>}
      </label>
      {hint && <p className="text-xs text-ink-muted mb-2">{hint}</p>}
      {children}
    </div>
  );
}
