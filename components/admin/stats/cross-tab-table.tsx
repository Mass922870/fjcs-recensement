import type { CrossTab } from "@/services/stats.service";
import { CROSS_DIMENSIONS, MULTI_VALUED_DIMENSIONS } from "@/lib/constants/stats";
import { ChartEmpty } from "@/components/admin/chart-card";

const nf = new Intl.NumberFormat("fr-FR");

/**
 * Tableau croisé avec teinte séquentielle (une seule couleur, plus foncé = plus élevé).
 * Le pourcentage affiché est la part de la cellule dans le total de sa ligne.
 */
export function CrossTabTable({ data }: { data: CrossTab }) {
  if (data.total === 0 || data.rows.length === 0) return <ChartEmpty />;

  const max = Math.max(
    1,
    ...data.rows.flatMap((r) => data.cols.map((c) => data.cells[r]?.[c] ?? 0)),
  );
  const multi =
    MULTI_VALUED_DIMENSIONS.includes(data.rowDimension) ||
    MULTI_VALUED_DIMENSIONS.includes(data.colDimension);

  return (
    <div className="space-y-3">
      <div className="border-border overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/40">
              <th
                scope="col"
                className="bg-muted/40 text-muted-foreground sticky left-0 px-3 py-2 text-left text-xs font-medium"
              >
                {CROSS_DIMENSIONS[data.rowDimension]} ↓ / {CROSS_DIMENSIONS[data.colDimension]} →
              </th>
              {data.cols.map((c) => (
                <th
                  key={c}
                  scope="col"
                  className="text-muted-foreground px-3 py-2 text-right text-xs font-medium whitespace-nowrap"
                >
                  {c}
                </th>
              ))}
              <th
                scope="col"
                className="text-foreground px-3 py-2 text-right text-xs font-semibold"
              >
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {data.rows.map((r) => {
              const rowTotal = data.rowTotals[r] ?? 0;
              return (
                <tr key={r} className="border-border border-t">
                  <th
                    scope="row"
                    className="text-foreground sticky left-0 bg-white px-3 py-2 text-left font-medium whitespace-nowrap"
                  >
                    {r}
                  </th>
                  {data.cols.map((c) => {
                    const v = data.cells[r]?.[c] ?? 0;
                    const alpha = v === 0 ? 0 : 0.12 + 0.68 * (v / max);
                    const pct = rowTotal ? Math.round((v / rowTotal) * 100) : 0;
                    return (
                      <td
                        key={c}
                        className="px-3 py-2 text-right tabular-nums"
                        style={{
                          background: v
                            ? `color-mix(in oklab, var(--chart-1) ${Math.round(alpha * 100)}%, white)`
                            : undefined,
                          color: alpha > 0.55 ? "white" : undefined,
                        }}
                        title={`${r} × ${c} : ${nf.format(v)} (${pct} % de la ligne)`}
                      >
                        {v ? (
                          <>
                            <span className="font-medium">{nf.format(v)}</span>
                            <span className="ml-1 text-[11px] opacity-70">{pct} %</span>
                          </>
                        ) : (
                          <span className="text-muted-foreground/50">·</span>
                        )}
                      </td>
                    );
                  })}
                  <td className="px-3 py-2 text-right font-semibold tabular-nums">
                    {nf.format(rowTotal)}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-border bg-muted/40 border-t">
              <th
                scope="row"
                className="bg-muted/40 sticky left-0 px-3 py-2 text-left text-xs font-semibold"
              >
                Total
              </th>
              {data.cols.map((c) => (
                <td key={c} className="px-3 py-2 text-right text-xs font-semibold tabular-nums">
                  {nf.format(data.colTotals[c] ?? 0)}
                </td>
              ))}
              <td className="px-3 py-2 text-right text-xs font-semibold tabular-nums">
                {nf.format(data.total)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
      <p className="text-muted-foreground text-xs">
        {nf.format(data.total)} jeune{data.total > 1 ? "s" : ""} analysé{data.total > 1 ? "s" : ""}.
        {multi
          ? " Un même jeune peut apparaître dans plusieurs catégories (réponses multiples) : les totaux de lignes/colonnes peuvent dépasser l'effectif."
          : ""}
      </p>
    </div>
  );
}
