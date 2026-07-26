export function formatPrice(price: string | null, priceOnRequest: boolean): string {
  if (priceOnRequest || !price) return "Preço a combinar";
  const n = Number(price);
  if (!Number.isFinite(n)) return "Preço a combinar";
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: n % 1 === 0 ? 0 : 2 });
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove acentos
    .replace(/[^a-z0-9\s-]/g, "") // remove caracteres especiais
    .trim()
    .replace(/\s+/g, "-") // espaços -> hifens
    .replace(/-+/g, "-") // hifens duplicados
    .slice(0, 200);
}

export function formatLocation(city: string | null, state: string | null): string {
  if (city && state) return `${city} – ${state}`;
  return city ?? state ?? "";
}

export const CONDITION_LABELS: Record<string, string> = {
  new: "Novo",
  used_good: "Usado — bom estado",
  used_fair: "Usado — estado regular",
  scrap: "Sucata / peças",
};

export function timeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return "hoje";
  if (days === 1) return "ontem";
  if (days < 30) return `há ${days} dias`;
  const months = Math.floor(days / 30);
  if (months === 1) return "há 1 mês";
  if (months < 12) return `há ${months} meses`;
  const years = Math.floor(months / 12);
  return years === 1 ? "há 1 ano" : `há ${years} anos`;
}
