"use client";

const nf = new Intl.NumberFormat("fr-FR");

interface TooltipPayloadItem {
  name?: string;
  value?: number | string;
  color?: string;
  payload?: { label?: string; total?: number };
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string | number;
  total?: number;
}

/** Infobulle commune : texte en encre standard, pastille de couleur pour l'identité. */
export function ChartTooltip({ active, payload, label, total }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="border-border rounded-lg border bg-white px-3 py-2 text-xs shadow-md">
      <p className="text-foreground mb-1 font-medium">{label ?? payload[0]?.payload?.label}</p>
      {payload.map((p, i) => {
        const v = Number(p.value ?? 0);
        const pct = total ? ` · ${Math.round((v / total) * 100)} %` : "";
        return (
          <p key={i} className="text-muted-foreground flex items-center gap-1.5">
            <span className="inline-block size-2 rounded-full" style={{ background: p.color }} />
            {p.name && p.name !== "value" ? `${p.name} : ` : ""}
            <span className="text-foreground font-medium">{nf.format(v)}</span>
            {pct}
          </p>
        );
      })}
    </div>
  );
}
