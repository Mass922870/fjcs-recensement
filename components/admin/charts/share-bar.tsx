import type { DistributionRow } from "@/services/stats.service";
import { ChartEmpty } from "@/components/admin/chart-card";

const COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];
const nf = new Intl.NumberFormat("fr-FR");

/** Barre de répartition 100 % (part-du-tout) avec légende - sans dépendance graphique. */
export function ShareBar({ data }: { data: DistributionRow[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return <ChartEmpty />;
  return (
    <div className="space-y-4">
      <div
        className="flex h-6 w-full gap-0.5 overflow-hidden rounded-md"
        role="img"
        aria-label="Répartition"
      >
        {data.map((d, i) =>
          d.value > 0 ? (
            <div
              key={d.key}
              title={`${d.label} : ${nf.format(d.value)} (${Math.round((d.value / total) * 100)} %)`}
              style={{
                width: `${(d.value / total) * 100}%`,
                background: COLORS[i % COLORS.length],
              }}
            />
          ) : null,
        )}
      </div>
      <ul className="grid gap-2 sm:grid-cols-2">
        {data.map((d, i) => (
          <li key={d.key} className="flex items-center justify-between gap-3 text-sm">
            <span className="text-muted-foreground flex items-center gap-2">
              <span
                className="size-2.5 rounded-full"
                style={{ background: COLORS[i % COLORS.length] }}
              />
              {d.label}
            </span>
            <span className="text-foreground font-medium tabular-nums">
              {nf.format(d.value)}
              <span className="text-muted-foreground ml-1.5 text-xs font-normal">
                {Math.round((d.value / total) * 100)} %
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
