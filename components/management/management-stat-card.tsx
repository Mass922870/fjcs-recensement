import type { LucideIcon } from "lucide-react";
import { CountUp } from "@/components/shared/count-up";
import { cn } from "@/lib/utils";

// Composant serveur : seul <CountUp> est une île client, ce qui permet de
// recevoir directement l'icône Lucide et réduit le JavaScript envoyé.

interface Props {
  label: string;
  value: number | null;
  hint?: string;
  icon: LucideIcon;
  accent?: "brand" | "cyan" | "green" | "amber" | "rose";
  /** Décalage d'apparition, pour l'entrée en cascade d'une rangée de cartes. */
  index?: number;
  decimals?: number;
  suffix?: string;
  emptyLabel?: string;
}

const ACCENTS = {
  brand: "bg-brand-50 text-brand-700",
  cyan: "bg-cyan-50 text-cyan-700",
  green: "bg-green-50 text-green-700",
  amber: "bg-amber-50 text-amber-700",
  rose: "bg-rose-50 text-rose-700",
};

export function ManagementStatCard({
  label,
  value,
  hint,
  icon: Icon,
  accent = "brand",
  index = 0,
  decimals = 0,
  suffix = "",
  emptyLabel = "—",
}: Props) {
  return (
    <div
      style={{ animationDelay: `${index * 70}ms` }}
      className={cn(
        "border-border rounded-2xl border bg-white p-5",
        "transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_30px_-18px_rgba(15,10,77,0.45)]",
        "animate-in fade-in slide-in-from-bottom-2 fill-mode-backwards duration-500",
        "motion-reduce:animate-none motion-reduce:transition-none motion-reduce:hover:translate-y-0",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-muted-foreground text-sm font-medium">{label}</p>
        <span
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-lg",
            ACCENTS[accent],
          )}
        >
          <Icon className="size-4" aria-hidden />
        </span>
      </div>
      <p className="text-foreground mt-2 text-3xl font-semibold tabular-nums">
        {value === null ? (
          <span className="text-muted-foreground text-2xl">{emptyLabel}</span>
        ) : (
          <CountUp value={value} decimals={decimals} suffix={suffix} />
        )}
      </p>
      {hint ? <p className="text-muted-foreground mt-1 text-xs">{hint}</p> : null}
    </div>
  );
}
