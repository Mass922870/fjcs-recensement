import type { Metadata } from "next";
import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { ChevronRight, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/admin/page-header";
import { EmptyState } from "@/components/shared/states";
import { requireManagementPagePermission } from "@/lib/auth/session";
import { listMinutes } from "@/services/management/minutes.service";
import { MEETING_TYPE_LABELS, MINUTES_STATUS_LABELS } from "@/lib/constants/management";
import type { MinutesStatus } from "@/lib/generated/prisma/enums";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Procès-verbaux" };

const STATUS_STYLES: Record<MinutesStatus, string> = {
  BROUILLON: "bg-muted text-muted-foreground border-border",
  EN_REVISION: "bg-amber-50 text-amber-800 border-amber-200",
  A_VALIDER: "bg-cyan-50 text-cyan-800 border-cyan-200",
  VALIDE: "bg-green-50 text-green-700 border-green-200",
  ARCHIVE: "bg-muted text-muted-foreground border-border",
};

export default async function MinutesListPage() {
  await requireManagementPagePermission("minutes:view");
  const rows = await listMinutes();

  return (
    <div className="space-y-5">
      <PageHeader
        title="Procès-verbaux"
        description="Les comptes rendus de séance, du brouillon à la version validée."
      />

      {rows.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Aucun procès-verbal n'est disponible"
          description="Ouvrez le procès-verbal depuis une réunion : l'ordre du jour et la feuille de présence le préremplissent."
        />
      ) : (
        <ul className="border-border divide-border divide-y overflow-hidden rounded-2xl border bg-white">
          {rows.map((row) => (
            <li key={row.id}>
              <Link
                href={`/management/reunions/${row.meeting.id}/proces-verbal`}
                className="hover:bg-muted/40 flex items-center gap-4 px-5 py-4 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-foreground truncate text-sm font-medium">
                      {row.meeting.title}
                    </p>
                    <Badge variant="outline" className={cn(STATUS_STYLES[row.status])}>
                      {MINUTES_STATUS_LABELS[row.status]}
                    </Badge>
                    {row.version > 1 ? (
                      <Badge variant="secondary" className="text-[10px]">
                        version {row.version}
                      </Badge>
                    ) : null}
                  </div>
                  <p className="text-muted-foreground mt-0.5 text-xs">
                    Séance du {format(row.meeting.startsAt, "d MMMM yyyy", { locale: fr })} ·{" "}
                    {MEETING_TYPE_LABELS[row.meeting.type]}
                    {row.secretary
                      ? ` · secrétaire ${row.secretary.lastName} ${row.secretary.firstName}`
                      : ""}
                  </p>
                </div>
                <span className="text-muted-foreground hidden shrink-0 text-xs sm:block">
                  modifié {formatDistanceToNow(row.updatedAt, { addSuffix: true, locale: fr })}
                </span>
                <ChevronRight className="text-muted-foreground size-4 shrink-0" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
