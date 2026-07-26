import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4">
      <div className="text-center">
        <p className="text-6xl font-extrabold text-accent mb-4">404</p>
        <h1 className="font-heading text-xl font-bold text-ink mb-2">Página não encontrada</h1>
        <p className="text-sm text-ink-muted mb-6">A página que você procura não existe ou foi removida.</p>
        <Link href="/" className="inline-block rounded-xl bg-accent px-6 py-3 text-sm font-bold text-white hover:brightness-110 active:scale-[0.97] transition-all">
          Voltar para o início
        </Link>
      </div>
    </div>
  );
}
