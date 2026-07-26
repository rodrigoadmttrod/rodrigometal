"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type User = {
  id: string;
  name: string | null;
  companyName: string | null;
  email: string | null;
  phoneE164: string;
  city: string | null;
  state: string | null;
  description: text | null;
  isVerified: boolean;
  isActive: boolean;
  role: string;
  slug: string | null;
};

type Category = { id: string; name: string; slug: string };

type Props = {
  user: User;
  allCategories: Category[];
  userCategoryIds: string[];
  adminId: string;
};

const UF_OPTIONS = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];

export function AdminUserEditor({ user, allCategories, userCategoryIds, adminId }: Props) {
  const router = useRouter();
  const [name, setName] = useState(user.name || "");
  const [companyName, setCompanyName] = useState(user.companyName || "");
  const [city, setCity] = useState(user.city || "");
  const [state, setState] = useState(user.state || "");
  const [description, setDescription] = useState(user.description || "");
  const [isVerified, setIsVerified] = useState(user.isVerified);
  const [isActive, setIsActive] = useState(user.isActive);
  const [role, setRole] = useState(user.role);
  const [selectedCats, setSelectedCats] = useState<Set<string>>(new Set(userCategoryIds));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const toggleCat = (catId: string) => {
    setSelectedCats((prev) => {
      const next = new Set(prev);
      if (next.has(catId)) next.delete(catId);
      else next.add(catId);
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess(false);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          companyName,
          city,
          state,
          description,
          isVerified,
          isActive,
          role,
          categoryIds: Array.from(selectedCats),
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

      <div className="bg-card rounded-2xl border border-border shadow-card p-5">
        <h3 className="font-heading text-base font-bold text-ink mb-4">Dados do usuário</h3>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-ink-muted mb-1 block">Nome</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-ink-muted mb-1 block">Empresa</label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full rounded-xl border border-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-ink-muted mb-1 block">E-mail</label>
            <input
              type="email"
              value={user.email || ""}
              disabled
              className="w-full rounded-xl border border-border px-4 py-2.5 text-sm bg-surface text-ink-muted"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-ink-muted mb-1 block">Telefone</label>
            <input
              type="text"
              value={user.phoneE164}
              disabled
              className="w-full rounded-xl border border-border px-4 py-2.5 text-sm bg-surface text-ink-muted"
            />
          </div>
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
          <div>
            <label className="text-xs font-semibold text-ink-muted mb-1 block">Descrição</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent resize-y"
            />
          </div>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border shadow-card p-5">
        <h3 className="font-heading text-base font-bold text-ink mb-4">Categorias em que atua</h3>
        <div className="flex flex-wrap gap-2">
          {allCategories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => toggleCat(cat.id)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                selectedCats.has(cat.id)
                  ? "bg-accent text-white"
                  : "bg-surface text-ink-muted hover:bg-accent/10"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border shadow-card p-5">
        <h3 className="font-heading text-base font-bold text-ink mb-4">Controle de acesso</h3>
        <div className="space-y-3">
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-sm text-ink">Verificado (selo de confiança)</span>
            <button
              type="button"
              onClick={() => setIsVerified(!isVerified)}
              className={`relative w-12 h-6 rounded-full transition-colors ${isVerified ? "bg-accent" : "bg-gray-300"}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${isVerified ? "translate-x-6" : ""}`} />
            </button>
          </label>
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-sm text-ink">Conta ativa</span>
            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className={`relative w-12 h-6 rounded-full transition-colors ${isActive ? "bg-accent" : "bg-gray-300"}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${isActive ? "translate-x-6" : ""}`} />
            </button>
          </label>
          <div>
            <label className="text-xs font-semibold text-ink-muted mb-1 block">Papel (role)</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full rounded-xl border border-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent bg-white"
            >
              <option value="seller">Vendedor</option>
              <option value="buyer">Comprador</option>
              <option value="admin">Administrador</option>
            </select>
          </div>
        </div>
      </div>

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
          href="/admin/usuarios"
          className="rounded-xl border border-border px-6 py-3 text-sm font-bold text-ink hover:bg-surface transition-colors"
        >
          Cancelar
        </a>
      </div>
    </div>
  );
}
