"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

type Category = { id: string; name: string; slug: string };
type SellerCategory = { categoryId: string; categoryName: string; categorySlug: string };

type Props = {
  user: {
    name?: string | null;
    companyName?: string | null;
    description?: string | null;
    city?: string | null;
    state?: string | null;
    photoUrl?: string | null;
    slug?: string | null;
  };
  categories: Category[];
  sellerCategories: SellerCategory[];
};

const UF_OPTIONS = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];

export function ProfileForm({ user, categories, sellerCategories }: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(user.name || "");
  const [companyName, setCompanyName] = useState(user.companyName || "");
  const [description, setDescription] = useState(user.description || "");
  const [city, setCity] = useState(user.city || "");
  const [state, setState] = useState(user.state || "");
  const [photoUrl, setPhotoUrl] = useState(user.photoUrl || "");
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(
    new Set(sellerCategories.map((c) => c.categoryId))
  );
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handlePhotoUpload = async (file: File) => {
    setUploading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (data.ok) {
        setPhotoUrl(data.url);
      } else {
        setError(data.error || "Erro no upload da foto");
      }
    } catch {
      setError("Erro ao enviar foto");
    } finally {
      setUploading(false);
    }
  };

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) next.delete(categoryId);
      else next.add(categoryId);
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess(false);
    try {
      const res = await fetch("/api/profile/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          companyName,
          description,
          city,
          state,
          photoUrl: photoUrl || null,
          categoryIds: Array.from(selectedCategories),
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setSuccess(true);
        router.refresh();
      } else {
        setError(data.error || "Erro ao salvar");
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
          Perfil atualizado com sucesso.
        </div>
      )}

      {/* Photo */}
      <Section title="Foto do perfil">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full overflow-hidden bg-surface border border-border">
            {photoUrl ? (
              <img src={photoUrl} alt="Foto do perfil" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-ink-muted text-2xl">
                {companyName?.[0]?.toUpperCase() || name?.[0]?.toUpperCase() || "?"}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="rounded-xl border border-border px-4 py-2 text-sm font-semibold text-ink hover:bg-surface transition-colors disabled:opacity-50"
          >
            {uploading ? "Enviando..." : "Trocar foto"}
          </button>
          {photoUrl && (
            <button
              type="button"
              onClick={() => setPhotoUrl("")}
              className="text-sm text-ink-muted hover:text-red-600 transition-colors"
            >
              Remover
            </button>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handlePhotoUpload(e.target.files[0])}
        />
      </Section>

      {/* Basic info */}
      <Section title="Dados da empresa">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Nome da empresa">
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Ex: Usinagem São Paulo Ltda"
              className="w-full rounded-xl border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </Field>
          <Field label="Seu nome (contato)">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: João Silva"
              className="w-full rounded-xl border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </Field>
        </div>

        <Field label="Descrição" hint="Conte sobre sua empresa: quanto tempo no mercado, especialidades, área de cobertura.">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ex: Atuamos há 15 anos na compra e venda de equipamentos industriais usados. Especializados em motores elétricos e redutores. Atendemos todo o estado de SP."
            rows={4}
            className="w-full rounded-xl border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent resize-y"
          />
        </Field>

        <div className="grid grid-cols-3 gap-4">
          <Field label="Cidade">
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Ex: Guarulhos"
              className="rounded-xl border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </Field>
          <Field label="UF">
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

        <Field label="URL da vitrine" hint="Não pode ser alterada — preserva os links já indexados.">
          <input
            type="text"
            value={user.slug || ""}
            disabled
            className="w-full rounded-xl border border-border px-4 py-3 text-sm bg-surface text-ink-muted"
          />
        </Field>
      </Section>

      {/* Categories */}
      <Section title="Categorias que você trabalha" hint="Marque as categorias onde você costuma ter equipamento disponível. Aparece na sua vitrine.">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {categories.map((cat) => (
            <label key={cat.id} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedCategories.has(cat.id)}
                onChange={() => toggleCategory(cat.id)}
                className="w-5 h-5 rounded accent-orange-500"
              />
              <span className="text-sm text-ink">{cat.name}</span>
            </label>
          ))}
        </div>
      </Section>

      {/* Save */}
      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="w-full rounded-xl bg-accent px-6 py-3 text-sm font-bold text-white transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
      >
        {saving ? "Salvando..." : "Salvar perfil"}
      </button>
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

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-semibold text-ink mb-1.5">{label}</label>
      {hint && <p className="text-xs text-ink-muted mb-2">{hint}</p>}
      {children}
    </div>
  );
}
