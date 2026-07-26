"use client";
import { useState } from "react";
import Link from "next/link";

const NAV = [
  { href: "/categoria/equipamentos-industriais", label: "Equipamentos industriais" },
  { href: "/categoria/maquinas", label: "Máquinas" },
  { href: "/categoria/sucata-metalica", label: "Sucata metálica" },
  { href: "/buscar", label: "Todos os anúncios" },
  { href: "/painel/anunciar", label: "Anunciar grátis" },
];

export function MobileMenu() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Hamburger trigger — only visible on mobile */}
      <button
        type="button"
        aria-label={open ? "Fechar menu" : "Abrir menu"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="md:hidden flex flex-col justify-center items-center w-9 h-9 gap-[5px] rounded-lg hover:bg-brand-50 transition-colors"
      >
        <span
          className={`block h-0.5 w-5 bg-ink rounded transition-transform duration-200 ${open ? "translate-y-[7px] rotate-45" : ""}`}
        />
        <span
          className={`block h-0.5 w-5 bg-ink rounded transition-opacity duration-200 ${open ? "opacity-0" : ""}`}
        />
        <span
          className={`block h-0.5 w-5 bg-ink rounded transition-transform duration-200 ${open ? "-translate-y-[7px] -rotate-45" : ""}`}
        />
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          aria-hidden="true"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer */}
      <nav
        aria-label="Menu principal"
        className={`fixed top-0 left-0 z-40 h-full w-72 bg-white shadow-xl transition-transform duration-300 md:hidden ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-line">
          <Link href="/" onClick={() => setOpen(false)} className="flex items-baseline" aria-label="Rodrigometal">
            <span className="font-heading text-xl font-extrabold tracking-tight text-brand-900">RODRIGO</span>
            <span className="font-heading text-xl font-extrabold tracking-tight text-accent">METAL</span>
          </Link>
          <button
            type="button"
            aria-label="Fechar menu"
            onClick={() => setOpen(false)}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-muted text-ink-muted text-xl"
          >
            ×
          </button>
        </div>
        <ul className="mt-2 px-3">
          {NAV.map((n) => (
            <li key={n.href}>
              <Link
                href={n.href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-ink hover:bg-brand-50 hover:text-accent-dark transition-colors"
              >
                {n.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
