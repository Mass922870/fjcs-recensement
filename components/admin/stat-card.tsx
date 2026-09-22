import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: number;
  hint?: string;
  icon?: LucideIcon;
  accent?: "brand" | "cyan" | "green";
  className?: string;
}

const ACCENTS = {
  brand: "bg-brand-50 text-brand-700",
  cyan: "bg-cyan-50 text-cyan-700",
  green: "bg-green-50 text-green-700",
};

const nf = new Intl.NumberFormat("fr-FR");

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  accent = "brand",
  className,
}: StatCardProps) {
  return (
    <div className={cn("border-border rounded-2xl border bg-white p-5", className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-muted-foreground text-sm font-medium">{label}</p>
        {Icon ? (
          <span
            className={cn(
              "flex size-8 shrink-0 items-center justify-center rounded-lg",
              ACCENTS[accent],
            )}
          >
            <Icon className="size-4" aria-hidden />
          </span>
        ) : null}
      </div>
      <p className="text-foreground mt-2 text-3xl font-semibold">{nf.format(value)}</p>
      {hint ? <p className="text-muted-foreground mt-1 text-xs">{hint}</p> : null}
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="border-border rounded-2xl border bg-white p-5">
      <div className="bg-muted h-4 w-28 animate-pulse rounded" />
      <div className="bg-muted mt-3 h-8 w-20 animate-pulse rounded" />
    </div>
  );
}
