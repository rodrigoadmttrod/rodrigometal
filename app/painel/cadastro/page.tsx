"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";

const UFS = ["AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"];

export default function CadastroPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    companyName: "",
    email: "",
    password: "",
    phone: "",
    city: "",
    state: "",
  });

  function update(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/cadastro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!data.ok) {
        if (data.code === "PHONE_EXISTS") {
 setError(data.error);
          setLoading(false);
          // Destaca o link de login após 1s
          setTimeout(() => {
            const link = document.querySelector('a[href="/painel/entrar"]');
            if (link) (link as HTMLElement).focus();
          }, 100);
          return;
        }
        setError(data.error || "Erro ao cadastrar");
        setLoading(false);
        return;
      }

      // Auto-login após cadastro
      const result = await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
      });

      if (result?.error) {
        setError("Cadastro feito, mas erro no login. Tente entrar manualmente.");
        setLoading(false);
        return;
      }

      router.push("/painel");
    } catch {
      setError("Erro de conexão. Tente novamente.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-page flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="font-heading text-2xl font-extrabold tracking-tight">
            <span className="text-ink">RODRIGO</span>
            <span className="text-accent">METAL</span>
          </Link>
          <h1 className="font-heading text-xl font-bold mt-6 text-ink">Criar conta</h1>
          <p className="text-sm text-ink-muted mt-1">Anuncie grátis para todo o Brasil</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-card rounded-2xl shadow-card p-6 space-y-4">
          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-ink mb-1.5">Seu nome *</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              className="w-full rounded-xl border border-border bg-white px-4 py-3 text-base text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
              placeholder="João Silva"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-ink mb-1.5">Nome da empresa</label>
            <input
              type="text"
              value={form.companyName}
              onChange={(e) => update("companyName", e.target.value)}
              className="w-full rounded-xl border border-border bg-white px-4 py-3 text-base text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
              placeholder="Metalúrgica Silva"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-ink mb-1.5">E-mail *</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              className="w-full rounded-xl border border-border bg-white px-4 py-3 text-base text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
              placeholder="voce@empresa.com.br"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-ink mb-1.5">Senha *</label>
            <input
              type="password"
              required
              minLength={6}
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
              className="w-full rounded-xl border border-border bg-white px-4 py-3 text-base text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
              placeholder="Mínimo 6 caracteres"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-ink mb-1.5">WhatsApp / Telefone *</label>
            <input
              type="tel"
              required
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
              className="w-full rounded-xl border border-border bg-white px-4 py-3 text-base text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
              placeholder="(11) 99999-9999"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-sm font-semibold text-ink mb-1.5">Cidade</label>
              <input
                type="text"
                value={form.city}
                onChange={(e) => update("city", e.target.value)}
                className="w-full rounded-xl border border-border bg-white px-4 py-3 text-base text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                placeholder="Guarulhos"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-ink mb-1.5">UF</label>
              <select
                value={form.state}
                onChange={(e) => update("state", e.target.value)}
                className="w-full rounded-xl border border-border bg-white px-4 py-3 text-base text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
              >
                <option value="">--</option>
                {UFS.map((uf) => (
                  <option key={uf} value={uf}>{uf}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-accent px-6 py-3.5 text-base font-bold text-white transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
          >
            {loading ? "Criando..." : "Criar conta e começar a anunciar"}
          </button>
        </form>

        <p className="text-center text-sm text-ink-muted mt-6">
          Já tem conta?{" "}
          <Link href="/painel/entrar" className="text-accent font-semibold hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
