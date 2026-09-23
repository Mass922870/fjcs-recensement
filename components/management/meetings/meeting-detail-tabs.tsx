"use client";

import Link from "next/link";

import { format, formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import {
  ClipboardList,
  Clock,
  FileText,
  FolderClosed,
  History,
  Info,
  ListChecks,
  Plus,
  QrCode,
  Scale,
  UserCheck,
  Users,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/states";
import { AUDIT_ACTION_LABELS } from "@/lib/constants/audit";
import { ACTION_STATUS_LABELS, MEETING_TYPE_LABELS } from "@/lib/constants/management";
import { ActionFormDialog } from "@/components/management/actions/action-form-dialog";
import { DocumentsPanel } from "@/components/management/documents/documents-panel";
import type { DocumentRow } from "@/services/management/documents.service";
import type { ActionRow, DecisionRow } from "@/services/management/actions.service";
import type { SelectableMember } from "@/services/management/meetings.service";
import type { CommissionRow } from "@/services/management/members.service";
import type { MeetingDetail, MeetingHistoryEntry } from "@/services/management/meetings.service";

interface AttendanceSummary {
  expected: number;
  present: number;
  late: number;
  excused: number;
  absent: number;
  unmarked: number;
  rate: number | null;
}

interface Props {
  meeting: MeetingDetail;
  history: MeetingHistoryEntry[];
  attendance: AttendanceSummary;
  decisions: DecisionRow[];
  actions: ActionRow[];
  members: SelectableMember[];
  commissions: CommissionRow[];
  documents: DocumentRow[];
  canManageAttendance: boolean;
  canCreateAction: boolean;
  canUploadDocument: boolean;
  canDeleteDocument: boolean;
}

export function MeetingDetailTabs({
  meeting,
  history,
  attendance,
  decisions,
  actions,
  members,
  commissions,
  documents,
  canManageAttendance,
  canCreateAction,
  canUploadDocument,
  canDeleteDocument,
}: Props) {
  const totalDuration = meeting.agenda.reduce((sum, item) => sum + (item.duration ?? 0), 0);

  return (
    <Tabs defaultValue="informations" className="w-full">
      <div className="overflow-x-auto">
        <TabsList className="w-max">
          <TabsTrigger value="informations">
            <Info className="size-4" />
            Informations
          </TabsTrigger>
          <TabsTrigger value="ordre-du-jour">
            <ClipboardList className="size-4" />
            Ordre du jour
            {meeting.agenda.length ? (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">
                {meeting.agenda.length}
              </Badge>
            ) : null}
          </TabsTrigger>
          <TabsTrigger value="participants">
            <Users className="size-4" />
            Participants
            {meeting.participants.length ? (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">
                {meeting.participants.length}
              </Badge>
            ) : null}
          </TabsTrigger>
          <TabsTrigger value="presences">
            <UserCheck className="size-4" />
            Présences
            {attendance.rate !== null ? (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">
                {attendance.rate} %
              </Badge>
            ) : null}
          </TabsTrigger>
          <TabsTrigger value="decisions">
            <Scale className="size-4" />
            Décisions
            {decisions.length ? (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">
                {decisions.length}
              </Badge>
            ) : null}
          </TabsTrigger>
          <TabsTrigger value="actions">
            <ListChecks className="size-4" />
            Actions
            {actions.length ? (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">
                {actions.length}
              </Badge>
            ) : null}
          </TabsTrigger>
          <TabsTrigger value="pv">
            <FileText className="size-4" />
            Procès-verbal
          </TabsTrigger>
          <TabsTrigger value="documents">
            <FolderClosed className="size-4" />
            Documents
            {documents.length ? (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">
                {documents.length}
              </Badge>
            ) : null}
          </TabsTrigger>
          <TabsTrigger value="historique">
            <History className="size-4" />
            Historique
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="informations" className="mt-4">
        <dl className="border-border grid gap-x-8 gap-y-4 rounded-2xl border bg-white p-5 sm:grid-cols-2">
          <Row label="Type de séance" value={MEETING_TYPE_LABELS[meeting.type]} />
          <Row label="Commission" value={meeting.commission?.name ?? "Aucune"} />
          <Row
            label="Date et heure"
            value={`${format(meeting.startsAt, "EEEE d MMMM yyyy", { locale: fr })} à ${format(
              meeting.startsAt,
              "HH'h'mm",
              { locale: fr },
            )}${meeting.endsAt ? ` — ${format(meeting.endsAt, "HH'h'mm", { locale: fr })}` : ""}`}
          />
          <Row label="Lieu" value={meeting.location ?? "Non précisé"} />
          <Row
            label="Organisateur"
            value={
              meeting.organizer
                ? `${meeting.organizer.lastName} ${meeting.organizer.firstName}`
                : "Non précisé"
            }
          />
          <Row label="Référence" value={meeting.reference} mono />
          <Row
            label="Créée par"
            value={`${meeting.createdBy?.name ?? "—"}, ${formatDistanceToNow(meeting.createdAt, {
              addSuffix: true,
              locale: fr,
            })}`}
          />
          {meeting.description ? (
            <div className="sm:col-span-2">
              <dt className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                Objet de la séance
              </dt>
              <dd className="text-foreground mt-1 text-sm whitespace-pre-line">
                {meeting.description}
              </dd>
            </div>
          ) : null}
          {meeting.cancelReason ? (
            <div className="sm:col-span-2">
              <dt className="text-destructive text-xs font-medium tracking-wide uppercase">
                Motif de l&apos;annulation
              </dt>
              <dd className="text-foreground mt-1 text-sm">{meeting.cancelReason}</dd>
            </div>
          ) : null}
        </dl>
      </TabsContent>

      <TabsContent value="ordre-du-jour" className="mt-4">
        {meeting.agenda.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="Aucun point à l'ordre du jour"
            description="Modifiez la réunion pour y ajouter les points à traiter."
          />
        ) : (
          <div className="border-border overflow-hidden rounded-2xl border bg-white">
            {totalDuration > 0 ? (
              <p className="text-muted-foreground border-border flex items-center gap-2 border-b px-5 py-3 text-xs">
                <Clock className="size-3.5" aria-hidden />
                Durée prévue : {totalDuration} minutes
              </p>
            ) : null}
            <ol className="divide-border divide-y">
              {meeting.agenda.map((item) => (
                <li key={item.id} className="flex gap-3 px-5 py-4">
                  <span className="bg-brand-50 text-brand-700 mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md text-xs font-semibold">
                    {item.position + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-foreground text-sm font-medium">{item.title}</p>
                    {item.description ? (
                      <p className="text-muted-foreground mt-1 text-sm whitespace-pre-line">
                        {item.description}
                      </p>
                    ) : null}
                  </div>
                  {item.duration ? (
                    <span className="text-muted-foreground shrink-0 text-xs">
                      {item.duration} min
                    </span>
                  ) : null}
                </li>
              ))}
            </ol>
          </div>
        )}
      </TabsContent>

      <TabsContent value="participants" className="mt-4">
        {meeting.participants.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Aucun membre convoqué"
            description="Modifiez la réunion pour désigner les participants attendus."
          />
        ) : (
          <ul className="border-border divide-border divide-y overflow-hidden rounded-2xl border bg-white">
            {meeting.participants.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 px-5 py-3">
                <div className="min-w-0">
                  <p className="text-foreground text-sm font-medium">
                    {p.member.lastName} {p.member.firstName}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {p.member.role ?? "Membre"}
                    {p.member.commission ? ` · ${p.member.commission.name}` : ""}
                  </p>
                </div>
                {p.member.status !== "ACTIF" ? (
                  <Badge variant="secondary" className="shrink-0 text-[10px]">
                    {p.member.status.toLowerCase()}
                  </Badge>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </TabsContent>

      <TabsContent value="presences" className="mt-4">
        {meeting.participants.length === 0 ? (
          <EmptyState
            icon={UserCheck}
            title="Aucun membre convoqué"
            description="Ajoutez des participants avant de pointer les présences."
          />
        ) : (
          <div className="border-border space-y-4 rounded-2xl border bg-white p-5">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              <Count label="Présents" value={attendance.present} tone="text-green-700" />
              <Count label="Retards" value={attendance.late} tone="text-amber-700" />
              <Count label="Excusés" value={attendance.excused} tone="text-cyan-700" />
              <Count label="Absents" value={attendance.absent} tone="text-rose-700" />
              <Count
                label="Non renseignés"
                value={attendance.unmarked}
                tone="text-muted-foreground"
              />
            </div>
            <p className="text-muted-foreground text-sm">
              {attendance.rate === null
                ? "Aucun pointage pour l'instant."
                : `Taux de présence : ${attendance.rate} % sur ${attendance.expected} convoqués.`}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button asChild>
                <Link href={`/management/reunions/${meeting.id}/presences`}>
                  <UserCheck />
                  {canManageAttendance ? "Pointer les présences" : "Voir la feuille"}
                </Link>
              </Button>
              {canManageAttendance ? (
                <Button variant="outline" asChild>
                  <Link href={`/management/reunions/${meeting.id}/qr`}>
                    <QrCode />
                    QR de pointage
                  </Link>
                </Button>
              ) : null}
            </div>
          </div>
        )}
      </TabsContent>

      <TabsContent value="decisions" className="mt-4">
        {decisions.length === 0 ? (
          <EmptyState
            icon={Scale}
            title="Aucune décision consignée"
            description="Les décisions se saisissent point par point dans le procès-verbal de la séance."
          />
        ) : (
          <ul className="border-border divide-border divide-y overflow-hidden rounded-2xl border bg-white">
            {decisions.map((decision) => (
              <li key={decision.id} className="flex items-start justify-between gap-3 px-5 py-4">
                <div className="min-w-0 flex-1">
                  {decision.agendaItem ? (
                    <p className="text-muted-foreground text-xs">
                      Point {decision.agendaItem.position + 1} · {decision.agendaItem.title}
                    </p>
                  ) : null}
                  <p className="text-foreground mt-0.5 text-sm">{decision.title}</p>
                  {decision.actions.length > 0 ? (
                    <p className="text-muted-foreground mt-1.5 text-xs">
                      Suivie par {decision.actions.length} action
                      {decision.actions.length > 1 ? "s" : ""}
                    </p>
                  ) : null}
                </div>
                {canCreateAction ? (
                  <ActionFormDialog
                    members={members}
                    commissions={commissions}
                    fromDecision={{
                      decisionId: decision.id,
                      title: decision.title,
                      meetingId: meeting.id,
                    }}
                  >
                    <Button variant="outline" size="sm" className="shrink-0">
                      <Plus />
                      Créer une action
                    </Button>
                  </ActionFormDialog>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </TabsContent>

      <TabsContent value="actions" className="mt-4">
        {actions.length === 0 ? (
          <EmptyState
            icon={ListChecks}
            title="Aucune action issue de cette séance"
            description="Transformez une décision en action pour en assurer le suivi."
          />
        ) : (
          <ul className="border-border divide-border divide-y overflow-hidden rounded-2xl border bg-white">
            {actions.map((action) => (
              <li key={action.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                <div className="min-w-0 flex-1">
                  <p className="text-foreground truncate text-sm font-medium">{action.title}</p>
                  <p className="text-muted-foreground mt-0.5 text-xs">
                    {action.assignee
                      ? `${action.assignee.lastName} ${action.assignee.firstName}`
                      : "Non assignée"}
                    {action.dueDate
                      ? ` · échéance ${format(action.dueDate, "d MMMM yyyy", { locale: fr })}`
                      : ""}
                  </p>
                </div>
                <Badge variant="secondary" className="shrink-0">
                  {ACTION_STATUS_LABELS[action.status]}
                </Badge>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-3">
          <Button variant="outline" asChild>
            <Link href="/management/actions">
              <ListChecks />
              Voir toutes les actions
            </Link>
          </Button>
        </div>
      </TabsContent>

      <TabsContent value="pv" className="mt-4">
        <div className="border-border space-y-3 rounded-2xl border bg-white p-5">
          <p className="text-muted-foreground text-sm">
            Le procès-verbal reprend l&apos;ordre du jour et la feuille de présence de cette
            séance. Il suit un circuit de validation et se fige en versions successives.
          </p>
          <Button asChild>
            <Link href={`/management/reunions/${meeting.id}/proces-verbal`}>
              <FileText />
              Ouvrir le procès-verbal
            </Link>
          </Button>
        </div>
      </TabsContent>

      <TabsContent value="documents" className="mt-4">
        <DocumentsPanel
          documents={documents}
          meetingId={meeting.id}
          canUpload={canUploadDocument}
          canDelete={canDeleteDocument}
        />
      </TabsContent>

      <TabsContent value="historique" className="mt-4">
        {history.length === 0 ? (
          <EmptyState
            icon={History}
            title="Aucun évènement"
            description="Les créations, modifications et changements d'état apparaîtront ici."
          />
        ) : (
          <ol className="border-border space-y-4 rounded-2xl border bg-white p-5">
            {history.map((entry) => (
              <li key={entry.id} className="flex gap-3">
                <span className="bg-border relative mt-1 flex w-px justify-center">
                  <span className="bg-cyan-500 absolute -top-0.5 size-2 rounded-full" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-foreground text-sm">
                    {AUDIT_ACTION_LABELS[entry.action]}
                    {entry.actor ? (
                      <span className="text-muted-foreground"> par {entry.actor.name}</span>
                    ) : null}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {format(entry.createdAt, "d MMMM yyyy 'à' HH'h'mm", { locale: fr })}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </TabsContent>
    </Tabs>
  );
}

function Count({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="border-border rounded-xl border p-3 text-center">
      <p className={`text-xl font-semibold tabular-nums ${tone}`}>{value}</p>
      <p className="text-muted-foreground mt-0.5 text-xs">{label}</p>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-muted-foreground text-xs font-medium tracking-wide uppercase">{label}</dt>
      <dd className={`text-foreground mt-1 text-sm ${mono ? "font-mono" : ""}`}>{value}</dd>
    </div>
  );
}
