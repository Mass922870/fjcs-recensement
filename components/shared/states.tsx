import { AlertTriangle, Inbox, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StateProps {
  title?: string;
  description?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  title = "Aucune donnée",
  description = "Nous n'avons encore aucune donnée correspondant à ces critères.",
  icon: Icon = Inbox,
  action,
  className,
}: StateProps) {
  return (
    <div
      className={cn(
        "border-border flex flex-col items-center justify-center rounded-2xl border border-dashed bg-white/60 px-6 py-14 text-center",
        className,
      )}
    >
      <span className="bg-muted text-muted-foreground mb-4 flex size-12 items-center justify-center rounded-full">
        <Icon className="size-5" aria-hidden />
      </span>
      <p className="text-foreground text-sm font-medium">{title}</p>
      <p className="text-muted-foreground mt-1 max-w-sm text-sm">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function ErrorState({
  title = "Une erreur est survenue",
  description = "Une erreur est survenue. Veuillez réessayer.",
  action,
  className,
}: StateProps) {
  return (
    <div
      role="alert"
      className={cn(
        "border-destructive/20 bg-destructive/5 flex flex-col items-center justify-center rounded-2xl border px-6 py-14 text-center",
        className,
      )}
    >
      <span className="bg-destructive/10 text-destructive mb-4 flex size-12 items-center justify-center rounded-full">
        <AlertTriangle className="size-5" aria-hidden />
      </span>
      <p className="text-foreground text-sm font-medium">{title}</p>
      <p className="text-muted-foreground mt-1 max-w-sm text-sm">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
