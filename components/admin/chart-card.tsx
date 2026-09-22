import { cn } from "@/lib/utils";

interface ChartCardProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function ChartCard({ title, description, action, children, className }: ChartCardProps) {
  return (
    <section className={cn("border-border flex flex-col rounded-2xl border bg-white", className)}>
      <header className="border-border/70 flex items-start justify-between gap-3 border-b px-5 py-4">
        <div className="space-y-0.5">
          <h2 className="text-foreground text-sm font-semibold">{title}</h2>
          {description ? <p className="text-muted-foreground text-xs">{description}</p> : null}
        </div>
        {action}
      </header>
      <div className="flex-1 p-5">{children}</div>
    </section>
  );
}

export function ChartCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("border-border rounded-2xl border bg-white", className)}>
      <div className="border-border/70 border-b px-5 py-4">
        <div className="bg-muted h-4 w-40 animate-pulse rounded" />
      </div>
      <div className="space-y-3 p-5">
        {[80, 65, 50, 35, 20].map((w) => (
          <div key={w} className="bg-muted h-4 animate-pulse rounded" style={{ width: `${w}%` }} />
        ))}
      </div>
    </div>
  );
}

/** Message affiché quand un graphique n'a aucune donnée. */
export function ChartEmpty({ message }: { message?: string }) {
  return (
    <div className="border-border text-muted-foreground flex h-48 items-center justify-center rounded-xl border border-dashed text-center text-sm">
      {message ?? "Les statistiques apparaîtront dès que les premières données seront collectées."}
    </div>
  );
}
