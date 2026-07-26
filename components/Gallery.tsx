"use client";

import Image from "next/image";
import { useState } from "react";

type Img = { url: string; altText: string | null };

/** Galeria da página do anúncio: imagem principal + miniaturas clicáveis.
 *  Sem dependências externas; funciona com 1 ou N imagens. */
export function Gallery({ images, title }: { images: Img[]; title: string }) {
  const [active, setActive] = useState(0);
  if (images.length === 0) {
    return (
      <div className="flex aspect-[4/3] items-center justify-center rounded-lg border border-line bg-surface-muted text-sm text-ink-muted">
        Sem foto
      </div>
    );
  }
  const current = images[Math.min(active, images.length - 1)];
  return (
    <div>
      <div className="relative aspect-[4/3] overflow-hidden rounded-lg border border-line bg-surface-muted">
        <Image
          src={current.url}
          alt={current.altText ?? title}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 60vw"
          className="object-cover"
        />
      </div>
      {images.length > 1 && (
        <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button
              key={img.url + i}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Foto ${i + 1} de ${images.length}`}
              className={`relative aspect-[4/3] w-20 shrink-0 overflow-hidden rounded border-2 transition-colors ${
                i === active ? "border-accent" : "border-transparent hover:border-line"
              }`}
            >
              <Image src={img.url} alt="" fill sizes="80px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
