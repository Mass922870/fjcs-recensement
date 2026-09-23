import type { Metadata } from "next";
import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ChevronRight, UserCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/admin/page-header";
import { EmptyState } from "@/components/shared/states";
import { MeetingStatusBadge } from "@/components/management/meetings/meetings-table";
import { requireManagementPagePermission } from "@/lib/auth/session";
import { listAttendanceOverview } from "@/services/management/attendance.service";
import { MEETING_TYPE_LABELS } from "@/lib/constants/management";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Présences" };

/** Barre de taux : verte au-dessus de 70 %, ambre au-dessus de 40 %, sinon rouge. */
function rateColor(rate: number): string {
  if (rate >= 70) return "bg-green-500";
  if (rate >= 40) return "bg-amber-500";
  return "bg-rose-500";
}

export default async function AttendanceOverviewPage() {
  await requireManagementPagePermission("attendance:view");
  const rows = await listAttendanceOverview();

  return (
    <div className="space-y-5">
      <PageHeader
        title="Présences"
        description="Le pointage de chaque séance, du plus récent au plus ancien."
      />

      {rows.length === 0 ? (
        <EmptyState
          icon={UserCheck}
          title="Aucune séance à pointer"
          description="Les feuilles de présence apparaîtront ici dès qu'une réunion sera planifiée."
        />
      ) : (
        <ul className="border-border divide-border divide-y overflow-hidden rounded-2xl border bg-white">
          {rows.map((row) => (
            <li key={row.id}>
              <Link
                href={`/management/reunions/${row.id}/presences`}
                className="hover:bg-muted/40 flex items-center gap-4 px-5 py-4 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-foreground truncate text-sm font-medium">{row.title}</p>
                    <MeetingStatusBadge status={row.status} />
                  </div>
                  <p className="text-muted-foreground mt-0.5 text-xs">
                    {format(row.startsAt, "d MMMM yyyy", { locale: fr })} ·{" "}
                    {MEETING_TYPE_LABELS[row.type]}
                  </p>
                </div>

                <div className="hidden w-48 shrink-0 sm:block">
                  {row.rate === null ? (
                    <Badge variant="secondary" className="text-[10px]">
                      aucun convoqué
                    </Badge>
                  ) : row.marked === 0 ? (
                    <Badge variant="secondary" className="text-[10px]">
                      non pointée
                    </Badge>
                  ) : (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          {row.present} / {row.expected}
                        </span>
                        <span className="text-foreground font-medium tabular-nums">
                          {row.rate} %
                        </span>
                      </div>
                      <div className="bg-muted h-1.5 overflow-hidden rounded-full">
                        <div
                          className={cn("h-full rounded-full", rateColor(row.rate))}
                          style={{ width: `${Math.min(100, row.rate)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <ChevronRight className="text-muted-foreground size-4 shrink-0" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
