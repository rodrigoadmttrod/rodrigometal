export const SITE = {
  name: "Rodrigometal",
  tagline: "Marketplace industrial do Brasil",
  description:
    "Compre e venda sucata metálica, máquinas e equipamentos industriais. Anuncie grátis e negocie direto com o vendedor pelo WhatsApp.",
  url: "https://rodrigometal.com.br",
  city: "São Paulo",
  state: "SP",
  whatsapp: "5511999999999",
  email: "contato@rodrigometal.com.br",
};

/**
 * Build a WhatsApp deep link (wa.me) with a pre-filled message.
 */
export function waLink(phoneE164: string, message: string): string {
  const clean = phoneE164.replace(/\D/g, "");
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${clean}?text=${encoded}`;
}
