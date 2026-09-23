import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ArrowLeft, CalendarClock, MapPin, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MeetingStatusBadge } from "@/components/management/meetings/meetings-table";
import { MeetingActions } from "@/components/management/meetings/meeting-actions";
import { MeetingDetailTabs } from "@/components/management/meetings/meeting-detail-tabs";
import { requireManagementPagePermission } from "@/lib/auth/session";
import { hasManagementPermission } from "@/lib/auth/management-rbac";
import { getMeeting, getMeetingHistory } from "@/services/management/meetings.service";
import { getAttendanceSheet } from "@/services/management/attendance.service";
import { listActions, listDecisions } from "@/services/management/actions.service";
import { listSelectableMembers } from "@/services/management/meetings.service";
import { listCommissions } from "@/services/management/members.service";
import { actionFiltersSchema } from "@/schemas/management/actions";
import { listDocuments } from "@/services/management/documents.service";
import { MEETING_TYPE_LABELS } from "@/lib/constants/management";
import { NotFoundError } from "@/lib/errors";

export async function generateMetadata(
  props: PageProps<"/management/reunions/[id]">,
): Promise<Metadata> {
  const { id } = await props.params;
  try {
    const meeting = await getMeeting(id);
    return { title: meeting.title };
  } catch {
    return { title: "Réunion" };
  }
}

export default async function MeetingDetailPage(props: PageProps<"/management/reunions/[id]">) {
  const user = await requireManagementPagePermission("meetings:view");
  const { id } = await props.params;

  let meeting;
  try {
    meeting = await getMeeting(id);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }

  const [history, sheet, decisions, allActions, members, commissions, documents] =
    await Promise.all([
      getMeetingHistory(meeting.id),
      getAttendanceSheet(meeting.id),
      listDecisions(meeting.id),
      listActions(actionFiltersSchema.parse({ view: "tableau" })),
      listSelectableMembers(),
      listCommissions(true),
      listDocuments({ meetingId: meeting.id }),
    ]);
  const actions = allActions.filter((a) => a.meeting?.id === meeting.id);
  const canEdit = hasManagementPermission(user.managementRole, "meetings:edit");
  const canDelete = hasManagementPermission(user.managementRole, "meetings:delete");
  const canManageAttendance = hasManagementPermission(user.managementRole, "attendance:manage");

  return (
    <div className="space-y-5">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href="/management/reunions">
          <ArrowLeft />
          Retour aux réunions
        </Link>
      </Button>

      <header className="border-border animate-in fade-in slide-in-from-bottom-1 rounded-2xl border bg-white p-5 duration-500 motion-reduce:animate-none">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <MeetingStatusBadge status={meeting.status} />
              <span className="text-muted-foreground font-mono text-xs">{meeting.reference}</span>
            </div>
            <h1 className="text-foreground text-2xl font-semibold">{meeting.title}</h1>
            <div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
              <span className="inline-flex items-center gap-1.5">
                <CalendarClock className="size-4" aria-hidden />
                {format(meeting.startsAt, "EEEE d MMMM yyyy 'à' HH'h'mm", { locale: fr })}
              </span>
              {meeting.location ? (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="size-4" aria-hidden />
                  {meeting.location}
                </span>
              ) : null}
              <span className="inline-flex items-center gap-1.5">
                <Users className="size-4" aria-hidden />
                {meeting.participants.length} convoqué
                {meeting.participants.length > 1 ? "s" : ""}
              </span>
              <span>{MEETING_TYPE_LABELS[meeting.type]}</span>
            </div>
          </div>

          <MeetingActions meeting={meeting} canEdit={canEdit} canDelete={canDelete} />
        </div>
      </header>

      <MeetingDetailTabs
        meeting={meeting}
        history={history}
        attendance={{ ...sheet.counts, rate: sheet.rate }}
        decisions={decisions}
        actions={actions}
        members={members}
        commissions={commissions}
        documents={documents}
        canManageAttendance={canManageAttendance}
        canCreateAction={hasManagementPermission(user.managementRole, "actions:create")}
        canUploadDocument={hasManagementPermission(user.managementRole, "documents:upload")}
        canDeleteDocument={hasManagementPermission(user.managementRole, "documents:delete")}
      />
    </div>
  );
}
