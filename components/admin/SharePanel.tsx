"use client";

import { useState } from "react";

type Listing = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  price: string | null;
  priceOnRequest: boolean;
  status: string;
  shareCount: number;
  createdAt: Date;
  categoryName: string | null;
  images: string[];
  specs: { specKey: string; value: string; unit: string | null }[];
};

const HASHTAGS = [
  "#sucataindustrial",
  "#maquinasusadas",
  "#redutores",
  "#motoreseletricos",
  "#bombasindustriais",
  "#equipamentosindustriais",
  "#compradesucata",
  "#vendadesucata",
  "#industriabrasil",
  "#manutencaoindustrial",
];

function generateCaption(l: Listing, siteUrl: string): string {
  const lines: string[] = [];
  
  // Title with emoji
  lines.push(`🔧 ${l.title}`);
  lines.push("");
  
  // Category
  if (l.categoryName) {
    lines.push(`📂 ${l.categoryName}`);
  }
  
  // Specs
  if (l.specs.length > 0) {
    lines.push("");
    lines.push("📋 Ficha técnica:");
    for (const s of l.specs.slice(0, 8)) {
      const unit = s.unit ? ` ${s.unit}` : "";
      lines.push(`• ${s.specKey}: ${s.value}${unit}`);
    }
  }
  
  // Price
  if (!l.priceOnRequest && l.price) {
    lines.push("");
    lines.push(`💰 R$ ${Number(l.price).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`);
  } else if (l.priceOnRequest) {
    lines.push("");
    lines.push("💰 Preço a combinar");
  }
  
  // Description (truncated)
  if (l.description && l.description !== l.title) {
    lines.push("");
    const desc = l.description.slice(0, 300);
    lines.push(desc);
  }
  
  // Link
  lines.push("");
  lines.push(`🔗 ${siteUrl}/anuncio/${l.slug}`);
  
  // Hashtags
  lines.push("");
  lines.push(HASHTAGS.join(" "));
  
  return lines.join("\n");
}

export function SharePanel({ listings: initialListings }: { listings: Listing[] }) {
  const [listings, setListings] = useState(initialListings);
  const [openId, setOpenId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [incrementing, setIncrementing] = useState<string | null>(null);

  const siteUrl = typeof window !== "undefined" ? window.location.origin.replace(/\/$/, "") : "https://rodrigometal.vercel.app";

  const handleShareClick = async (id: string) => {
    setOpenId(openId === id ? null : id);
    setCopied(false);
    
    // Increment share count
    setIncrementing(id);
    try {
      await fetch(`/api/admin/listings/${id}/share`, { method: "POST" });
      setListings((prev) =>
        prev.map((l) => (l.id === id ? { ...l, shareCount: l.shareCount + 1 } : l))
      );
    } catch {
      // ignore
    } finally {
      setIncrementing(null);
    }
  };

  const handleCopyCaption = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadImage = (url: string, title: string) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.slice(0, 50)}.jpg`;
    a.target = "_blank";
    a.click();
  };

  const sorted = [...listings].sort((a, b) => b.shareCount - a.shareCount || +new Date(b.createdAt) - +new Date(a.createdAt));

  return (
    <div className="space-y-3">
      {sorted.map((l) => {
        const isOpen = openId === l.id;
        const caption = generateCaption(l, siteUrl);
        const shareBadge = l.shareCount === 0 ? "Não compartilhado" : `Compartilhado ${l.shareCount}x`;
        const badgeColor = l.shareCount === 0 ? "bg-gray-100 text-gray-500" : "bg-green-50 text-green-700";

        return (
          <div key={l.id} className="rounded-2xl border border-border bg-card shadow-card overflow-hidden">
            {/* Header row */}
            <div className="flex items-center gap-3 px-4 py-3">
              {/* Thumbnail */}
              {l.images[0] ? (
                <img src={l.images[0]} alt={l.title} className="w-14 h-14 rounded-xl object-cover shrink-0" />
              ) : (
                <div className="w-14 h-14 rounded-xl bg-surface shrink-0 flex items-center justify-center text-ink-muted text-xs">
                  Sem foto
                </div>
              )}

              {/* Title + badge */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-ink truncate">{l.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-xs rounded px-2 py-0.5 font-semibold ${badgeColor}`}>{shareBadge}</span>
                  {l.categoryName && (
                    <span className="text-xs text-ink-muted">{l.categoryName}</span>
                  )}
                </div>
              </div>

              {/* Share button */}
              <button
                type="button"
                onClick={() => handleShareClick(l.id)}
                disabled={incrementing === l.id}
                className="rounded-xl bg-accent px-4 py-2 text-xs font-bold text-white transition-all hover:brightness-110 active:scale-[0.97] disabled:opacity-50 shrink-0"
              >
                {incrementing === l.id ? "..." : "Compartilhar"}
              </button>
            </div>

            {/* Expanded panel */}
            {isOpen && (
              <div className="border-t border-border px-4 py-4 space-y-4 bg-surface/50">
                {/* Photos */}
                {l.images.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-ink-muted mb-2">Fotos ({l.images.length})</p>
                    <div className="flex flex-wrap gap-3">
                      {l.images.map((url, idx) => (
                        <div key={idx} className="relative group">
                          <img
                            src={url}
                            alt={`${l.title} - foto ${idx + 1}`}
                            className="w-28 h-28 rounded-xl object-cover border border-border"
                          />
                          <button
                            type="button"
                            onClick={() => handleDownloadImage(url, l.title)}
                            className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center text-white text-xs font-semibold"
                          >
                            Baixar
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Caption */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-ink-muted">Legenda para Instagram</p>
                    <button
                      type="button"
                      onClick={() => handleCopyCaption(caption)}
                      className={`rounded-lg px-3 py-1 text-xs font-bold transition-all active:scale-[0.97] ${
                        copied ? "bg-green-500 text-white" : "bg-accent text-white hover:brightness-110"
                      }`}
                    >
                      {copied ? "Copiado!" : "Copiar legenda"}
                    </button>
                  </div>
                  <pre className="whitespace-pre-wrap text-xs text-ink bg-card border border-border rounded-xl p-3 max-h-64 overflow-y-auto font-sans">
                    {caption}
                  </pre>
                </div>

                {/* Direct links */}
                <div className="flex gap-2 flex-wrap">
                  <a
                    href={`https://www.instagram.com/`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-xl bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 px-4 py-2 text-xs font-bold text-white transition-all hover:brightness-110 active:scale-[0.97]"
                  >
                    Abrir Instagram
                  </a>
                  <a
                    href={`https://www.facebook.com/`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white transition-all hover:brightness-110 active:scale-[0.97]"
                  >
                    Abrir Facebook
                  </a>
                  <a
                    href={`${siteUrl}/anuncio/${l.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-xl border border-border px-4 py-2 text-xs font-bold text-ink hover:bg-surface transition-colors active:scale-[0.97]"
                  >
                    Ver anúncio no site
                  </a>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
