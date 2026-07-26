"use client";

import { waLink } from "@/lib/site";

type Props = {
  phoneE164: string;
  message: string;
  sellerId: string;
  listingId?: string;
  sourcePage: string;
  size?: "md" | "lg";
  fixedOnMobile?: boolean;
  className?: string;
};

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.297-.497.1-.198.05-.371-.025-.52-.074-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.71.306 1.263.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
    </svg>
  );
}

export function WhatsAppButton({
  phoneE164,
  message,
  sellerId,
  listingId,
  sourcePage,
  size = "lg",
  fixedOnMobile = false,
  className = "",
}: Props) {
  const href = waLink(phoneE164, message);

  function track() {
    // rastreio não pode bloquear a abertura do WhatsApp
    try {
      const payload = JSON.stringify({ sellerId, listingId: listingId ?? null, sourcePage });
      if (navigator.sendBeacon) {
        navigator.sendBeacon("/api/contato", new Blob([payload], { type: "application/json" }));
      } else {
        fetch("/api/contato", { method: "POST", body: payload, keepalive: true, headers: { "Content-Type": "application/json" } });
      }
    } catch {
      /* nunca bloquear o contato */
    }
  }

  const sizeCls = size === "lg" ? "px-6 py-3.5 text-base" : "px-4 py-2.5 text-sm";

  const button = (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={track}
      className={`inline-flex items-center justify-center gap-2.5 rounded-2xl bg-whatsapp ${sizeCls} font-bold text-white shadow-md hover:bg-whatsapp-dark btn-press w-full sm:w-auto ${className}`}
    >
      <WhatsAppIcon className={size === "lg" ? "size-6" : "size-5"} />
      <span>Chamar no WhatsApp</span>
    </a>
  );

  if (!fixedOnMobile) return button;

  return (
    <>
      <div className="hidden sm:block">{button}</div>
      {/* fixo no rodapé em mobile — regra de ouro 3.4 */}
      <div
        className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-white p-3 sm:hidden shadow-[0_-4px_12px_rgb(0_0_0/0.1)]"
        style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom, 0px))" }}
      >
        {button}
      </div>
      {/* espaço para o conteúdo não ficar escondido atrás do botão fixo.
          h-24 = 96px cobre barra (padding 12px*2 + botão ~52px) + safe-area */}
      <div className="h-24 sm:hidden" aria-hidden="true" />
    </>
  );
}
