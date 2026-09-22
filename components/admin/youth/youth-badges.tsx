import { Badge } from "@/components/ui/badge";
import { PROFILE_STATUS_LABELS } from "@/lib/constants/referentials";
import type { EmploymentKind, ProfileStatus } from "@/lib/generated/prisma/enums";
import { cn } from "@/lib/utils";

/** Couleur par sens statistique (les libellés sont configurables). */
const EMPLOYMENT_STYLES: Record<EmploymentKind, string> = {
  STUDENT: "bg-brand-50 text-brand-800 border-brand-100",
  EMPLOYED: "bg-cyan-50 text-cyan-700 border-cyan-100",
  ENTREPRENEUR: "bg-green-50 text-green-700 border-green-100",
  JOB_SEEKER: "bg-amber-50 text-amber-800 border-amber-100",
  INACTIVE: "bg-muted text-muted-foreground border-border",
  OTHER: "bg-muted text-muted-foreground border-border",
};

export function EmploymentBadge({
  status,
  className,
}: {
  status: { label: string; kind: EmploymentKind | string };
  className?: string;
}) {
  const style = EMPLOYMENT_STYLES[status.kind as EmploymentKind] ?? EMPLOYMENT_STYLES.OTHER;
  return (
    <Badge variant="outline" className={cn("font-medium", style, className)}>
      {status.label}
    </Badge>
  );
}

const STATUS_STYLES: Record<ProfileStatus, string> = {
  ACTIVE: "bg-green-50 text-green-700 border-green-100",
  ARCHIVED: "bg-muted text-muted-foreground border-border",
  ANONYMIZED: "bg-amber-50 text-amber-800 border-amber-100",
};

export function ProfileStatusBadge({ status }: { status: ProfileStatus }) {
  return (
    <Badge variant="outline" className={cn("font-medium", STATUS_STYLES[status])}>
      {PROFILE_STATUS_LABELS[status]}
    </Badge>
  );
}

/** Badge « tag » neutre (compétences, intérêts, besoins). */
export function TagBadge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "brand" | "cyan" | "green" | "warm";
}) {
  const tones = {
    neutral: "bg-muted text-foreground border-border",
    brand: "bg-brand-50 text-brand-800 border-brand-100",
    cyan: "bg-cyan-50 text-cyan-700 border-cyan-100",
    green: "bg-green-50 text-green-700 border-green-100",
    warm: "bg-amber-50 text-amber-800 border-amber-100",
  };
  return (
    <Badge variant="outline" className={cn("font-medium tracking-wide uppercase", tones[tone])}>
      {children}
    </Badge>
  );
}

export function DemoBadge() {
  return (
    <Badge
      variant="outline"
      className="border-amber-200 bg-amber-50 text-[10px] font-semibold text-amber-800 uppercase"
    >
      Démo
    </Badge>
  );
}
