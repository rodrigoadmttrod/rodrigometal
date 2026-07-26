import Link from "next/link";
import { SITE } from "@/lib/site";

export function Footer() {
  return (
    <footer className="bg-[var(--color-footer)] text-[var(--color-footer-text)] mt-12">
      <div className="mx-auto max-w-7xl px-4 py-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="font-heading text-lg font-extrabold text-white">
            RODRIGO<span className="text-accent">METAL</span>
          </p>
          <p className="mt-2 text-sm leading-relaxed">{SITE.tagline}. Anuncie grátis e negocie direto com o vendedor pelo WhatsApp.</p>
        </div>
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-white">Categorias</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link href="/categoria/equipamentos-industriais" className="hover:text-accent">Equipamentos industriais</Link></li>
            <li><Link href="/categoria/maquinas" className="hover:text-accent">Máquinas</Link></li>
            <li><Link href="/categoria/sucata-metalica" className="hover:text-accent">Sucata metálica</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-white">Institucional</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link href="/sobre" className="hover:text-accent">Sobre o Rodrigometal</Link></li>
            <li><Link href="/contato" className="hover:text-accent">Fale conosco</Link></li>
            <li><Link href="/termos" className="hover:text-accent">Termos de uso e privacidade</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-white">Para vendedores</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link href="/painel/anunciar" className="hover:text-accent">Anunciar grátis</Link></li>
            <li><Link href="/painel" className="hover:text-accent">Meu painel</Link></li>
            <li><Link href="/buscar" className="hover:text-accent">Ver anúncios</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/5">
        <div className="mx-auto max-w-7xl px-4 py-4 text-xs text-[var(--color-footer-text)]/60 flex flex-col sm:flex-row gap-1 sm:justify-between">
          <span>© {new Date().getFullYear()} {SITE.name} — {SITE.city}/{SITE.state}. Todos os direitos reservados.</span>
          <span>Plataforma em desenvolvimento — dados de demonstração.</span>
        </div>
      </div>
    </footer>
  );
}
