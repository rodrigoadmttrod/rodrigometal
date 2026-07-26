export function SoldBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-lg bg-ink/75 px-2 py-0.5 text-[11px] font-semibold text-white ${className}`}
      title="Este item já foi vendido — o vendedor costuma ter itens semelhantes"
    >
      Vendido
    </span>
  );
}

export function VerifiedBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-lg bg-brand-100 px-2 py-0.5 text-xs font-semibold text-brand-800 ${className}`}
      title="Vendedor verificado pela equipe Rodrigometal"
    >
      <svg viewBox="0 0 20 20" fill="currentColor" className="size-3.5" aria-hidden="true">
        <path
          fillRule="evenodd"
          d="M16.403 12.652a3 3 0 0 0 0-5.304 3 3 0 0 0-3.75-3.751 3 3 0 0 0-5.305 0 3 3 0 0 0-3.751 3.75 3 3 0 0 0 0 5.305 3 3 0 0 0 3.75 3.751 3 3 0 0 0 5.305 0 3 3 0 0 0 3.751-3.75Zm-2.546-4.46a.75.75 0 0 0-1.214-.883l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z"
          clipRule="evenodd"
        />
      </svg>
      Verificado
    </span>
  );
}

export function ConditionBadge({ condition }: { condition: string | null }) {
  const labels: Record<string, string> = {
    new: "Novo",
    used_good: "Usado — bom",
    used_fair: "Usado — regular",
    scrap: "Sucata / peças",
  };
  if (!condition || !labels[condition]) return null;
  return (
    <span className="inline-flex items-center rounded-lg bg-surface-muted px-2 py-0.5 text-xs font-medium text-ink-muted">
      {labels[condition]}
    </span>
  );
}
