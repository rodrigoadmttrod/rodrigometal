export type Spec = { specKey: string; value: string; unit: string | null };

export function SpecTable({ specs, title = "Ficha técnica" }: { specs: Spec[]; title?: string }) {
  if (specs.length === 0) return null;
  return (
    <section aria-label={title}>
      <h2 className="mb-3 text-lg font-bold text-ink">{title}</h2>
      <table className="w-full border-collapse overflow-hidden rounded-lg border border-line text-sm">
        <tbody>
          {specs.map((s, i) => (
            <tr key={s.specKey + i} className={i % 2 === 0 ? "bg-surface-muted" : "bg-white"}>
              <th scope="row" className="w-2/5 border-b border-line px-3 py-2 text-left font-semibold text-ink-muted">
                {s.specKey}
              </th>
              <td className="border-b border-line px-3 py-2 text-ink">
                {s.value}
                {s.unit ? ` ${s.unit}` : ""}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
