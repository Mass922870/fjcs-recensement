import type { QuartierAggregate } from "@/services/stats.service";

const nf = new Intl.NumberFormat("fr-FR");

export function MapLegend({ data }: { data: QuartierAggregate[] }) {
  const max = Math.max(0, ...data.map((d) => d.count));
  const total = data.reduce((s, d) => s + d.count, 0);
  const steps = max > 0 ? [Math.max(1, Math.round(max * 0.25)), Math.round(max * 0.6), max] : [];
  const sorted = [...data].sort((a, b) => b.count - a.count);

  return (
    <div className="space-y-5">
      <div>
        <p className="text-foreground text-sm font-semibold">Légende</p>
        <p className="text-muted-foreground mt-0.5 text-xs">
          La taille et l'intensité du cercle sont proportionnelles au nombre de jeunes recensés dans
          le quartier.
        </p>
        {steps.length ? (
          <ul className="mt-3 flex items-end gap-5">
            {steps.map((s, i) => {
              const size = 12 + i * 10;
              return (
                <li key={s} className="flex flex-col items-center gap-1.5">
                  <span
                    className="rounded-full border-2 border-white shadow-sm"
                    style={{
                      width: size,
                      height: size,
                      background: `rgba(74,69,196,${0.35 + 0.5 * (s / max)})`,
                    }}
                  />
                  <span className="text-muted-foreground text-xs tabular-nums">{nf.format(s)}</span>
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>

      <div>
        <p className="text-foreground mb-2 text-sm font-semibold">Par quartier</p>
        {total === 0 ? (
          <p className="text-muted-foreground text-sm">
            Les statistiques apparaîtront dès que les premières données seront collectées.
          </p>
        ) : (
          <ul className="divide-border/70 divide-y">
            {sorted.map((q) => (
              <li key={q.id} className="flex items-center justify-between gap-3 py-1.5 text-sm">
                <span className={q.count === 0 ? "text-muted-foreground" : "text-foreground"}>
                  {q.name}
                </span>
                <span className="flex items-center gap-2">
                  <span className="bg-muted h-1.5 w-16 overflow-hidden rounded-full">
                    <span
                      className="bg-brand-500 block h-full rounded-full"
                      style={{ width: `${max ? (q.count / max) * 100 : 0}%` }}
                    />
                  </span>
                  <span className="w-8 text-right font-medium tabular-nums">
                    {nf.format(q.count)}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
