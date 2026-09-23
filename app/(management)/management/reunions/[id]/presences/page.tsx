import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ArrowLeft, Download, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/admin/page-header";
import { AttendanceSheetEditor } from "@/components/management/attendance/attendance-sheet";
import { ManagementStatCard } from "@/components/management/management-stat-card";
import { requireManagementPagePermission } from "@/lib/auth/session";
import { hasManagementPermission } from "@/lib/auth/management-rbac";
import { getAttendanceSheet } from "@/services/management/attendance.service";
import { NotFoundError } from "@/lib/errors";
import { CheckCircle2, Clock, UserMinus, UserRound } from "lucide-react";

export const metadata: Metadata = { title: "Feuille de présence" };

export default async function AttendancePage(
  props: PageProps<"/management/reunions/[id]/presences">,
) {
  const user = await requireManagementPagePermission("attendance:view");
  const { id } = await props.params;

  let sheet;
  try {
    sheet = await getAttendanceSheet(id);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }

  const canManage = hasManagementPermission(user.managementRole, "attendance:manage");
  const canExport = hasManagementPermission(user.managementRole, "attendance:export");

  return (
    <div className="space-y-5">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href={`/management/reunions/${sheet.meeting.id}`}>
          <ArrowLeft />
          Retour à la réunion
        </Link>
      </Button>

      <PageHeader
        title="Feuille de présence"
        description={`${sheet.meeting.title} · ${format(sheet.meeting.startsAt, "EEEE d MMMM yyyy", { locale: fr })}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {canManage ? (
              <Button variant="outline" asChild>
                <Link href={`/management/reunions/${sheet.meeting.id}/qr`}>
                  <QrCode />
                  QR de pointage
                </Link>
              </Button>
            ) : null}
            {canExport ? (
              <Button variant="outline" asChild>
                <a
                  href={`/api/management/presences/${sheet.meeting.id}?download=1`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Download />
                  Feuille PDF
                </a>
              </Button>
            ) : null}
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <ManagementStatCard index={0} label="Convoqués" value={sheet.counts.expected} icon={UserRound} />
        <ManagementStatCard index={1} label="Présents" value={sheet.counts.present} icon={CheckCircle2} accent="green" />
        <ManagementStatCard index={2} label="Retards" value={sheet.counts.late} icon={Clock} accent="amber" />
        <ManagementStatCard index={3} label="Absents" value={sheet.counts.absent} icon={UserMinus} accent="rose" hint={`${sheet.counts.excused} excusé(s)`} />
        <ManagementStatCard
          index={4}
          label="Taux de présence"
          value={sheet.rate}
          decimals={1}
          suffix=" %"
          icon={CheckCircle2}
          accent="cyan"
          emptyLabel="Pas encore pointé"
          hint={`${sheet.counts.unmarked} non renseigné(s)`}
        />
      </div>

      <AttendanceSheetEditor sheet={sheet} canManage={canManage} />
    </div>
  );
}
