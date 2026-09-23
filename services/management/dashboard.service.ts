import { endOfMonth, startOfMonth, startOfToday } from "date-fns";
import { prisma } from "@/lib/db";
import { isDemoDataVisible } from "@/lib/demo-data";
import type { ActionStatus, AuditAction } from "@/lib/generated/prisma/enums";

/** Statuts d'action considérés comme encore ouverts. */
const OPEN_ACTION_STATUSES: ActionStatus[] = ["A_FAIRE", "EN_COURS", "BLOQUE"];

export interface ManagementKpis {
  meetingsThisMonth: number;
  attendanceRate: number | null;
  minutesToFinalize: number;
  minutesToValidate: number;
  actionsOpen: number;
  actionsDone: number;
  actionsOverdue: number;
}

export interface UpcomingMeeting {
  id: string;
  reference: string;
  title: string;
  type: string;
  startsAt: Date;
  location: string | null;
  commission: string | null;
  participantCount: number;
}

export interface WatchedAction {
  id: string;
  title: string;
  dueDate: Date | null;
  priority: string;
  status: string;
  assignee: string | null;
  overdue: boolean;
}

export interface PendingMinutes {
  id: string;
  meetingTitle: string;
  meetingDate: Date;
  status: string;
  updatedAt: Date;
}

/** Exclut les enregistrements de démonstration sauf en développement explicite. */
function demoFilter(): { isDemo?: false } {
  return isDemoDataVisible() ? {} : { isDemo: false };
}

export async function getManagementKpis(): Promise<ManagementKpis> {
  const now = new Date();
  const today = startOfToday();
  const demo = demoFilter();

  const [
    meetingsThisMonth,
    attendance,
    minutesToFinalize,
    minutesToValidate,
    actionsOpen,
    actionsDone,
    actionsOverdue,
  ] = await Promise.all([
    prisma.meeting.count({
      where: {
        ...demo,
        status: { not: "ANNULEE" },
        startsAt: { gte: startOfMonth(now), lte: endOfMonth(now) },
      },
    }),
    prisma.attendance.groupBy({
      by: ["status"],
      _count: { _all: true },
      where: { meeting: demo },
    }),
    prisma.minutes.count({ where: { status: { in: ["BROUILLON", "EN_REVISION"] } } }),
    prisma.minutes.count({ where: { status: "A_VALIDER" } }),
    prisma.actionItem.count({ where: { ...demo, status: { in: OPEN_ACTION_STATUSES } } }),
    prisma.actionItem.count({ where: { ...demo, status: "TERMINE" } }),
    prisma.actionItem.count({
      where: { ...demo, status: { in: OPEN_ACTION_STATUSES }, dueDate: { lt: today } },
    }),
  ]);

  const total = attendance.reduce((sum, row) => sum + row._count._all, 0);
  // Un retard reste une présence : il compte dans le taux, pas dans les absences.
  const present = attendance
    .filter((row) => row.status === "PRESENT" || row.status === "RETARD")
    .reduce((sum, row) => sum + row._count._all, 0);

  return {
    meetingsThisMonth,
    attendanceRate: total > 0 ? Math.round((present / total) * 1000) / 10 : null,
    minutesToFinalize,
    minutesToValidate,
    actionsOpen,
    actionsDone,
    actionsOverdue,
  };
}

export async function getUpcomingMeetings(limit = 5): Promise<UpcomingMeeting[]> {
  const meetings = await prisma.meeting.findMany({
    where: {
      ...demoFilter(),
      status: { in: ["PLANIFIEE", "EN_COURS"] },
      startsAt: { gte: startOfToday() },
    },
    orderBy: { startsAt: "asc" },
    take: limit,
    select: {
      id: true,
      reference: true,
      title: true,
      type: true,
      startsAt: true,
      location: true,
      commission: { select: { name: true } },
      _count: { select: { participants: true } },
    },
  });

  return meetings.map((m) => ({
    id: m.id,
    reference: m.reference,
    title: m.title,
    type: m.type,
    startsAt: m.startsAt,
    location: m.location,
    commission: m.commission?.name ?? null,
    participantCount: m._count.participants,
  }));
}

/** Actions en retard ou dont l'échéance approche, les plus urgentes d'abord. */
export async function getWatchedActions(limit = 6): Promise<WatchedAction[]> {
  const today = startOfToday();
  const horizon = new Date(today);
  horizon.setDate(horizon.getDate() + 14);

  const actions = await prisma.actionItem.findMany({
    where: {
      ...demoFilter(),
      status: { in: OPEN_ACTION_STATUSES },
      dueDate: { not: null, lte: horizon },
    },
    orderBy: [{ dueDate: "asc" }, { priority: "desc" }],
    take: limit,
    select: {
      id: true,
      title: true,
      dueDate: true,
      priority: true,
      status: true,
      assignee: { select: { firstName: true, lastName: true } },
    },
  });

  return actions.map((a) => ({
    id: a.id,
    title: a.title,
    dueDate: a.dueDate,
    priority: a.priority,
    status: a.status,
    assignee: a.assignee ? `${a.assignee.firstName} ${a.assignee.lastName}` : null,
    overdue: a.dueDate != null && a.dueDate < today,
  }));
}

export async function getPendingMinutes(limit = 5): Promise<PendingMinutes[]> {
  const minutes = await prisma.minutes.findMany({
    where: { status: { in: ["BROUILLON", "EN_REVISION", "A_VALIDER"] } },
    orderBy: { updatedAt: "desc" },
    take: limit,
    select: {
      id: true,
      status: true,
      updatedAt: true,
      meeting: { select: { title: true, startsAt: true } },
    },
  });

  return minutes.map((m) => ({
    id: m.id,
    meetingTitle: m.meeting.title,
    meetingDate: m.meeting.startsAt,
    status: m.status,
    updatedAt: m.updatedAt,
  }));
}

export interface ActivityEntry {
  id: string;
  label: string;
  actor: string | null;
  createdAt: Date;
}

/** Actions de l'espace interne, lues dans le journal d'audit partagé. */
const MANAGEMENT_ACTIVITY_LABELS: Record<string, string> = {
  MEMBER_CREATED: "a ajouté un membre",
  MEMBER_UPDATED: "a modifié un membre",
  MEMBER_ARCHIVED: "a archivé un membre",
  COMMISSION_CREATED: "a créé une commission",
  COMMISSION_UPDATED: "a modifié une commission",
  COMMISSION_DELETED: "a supprimé une commission",
  MEETING_CREATED: "a créé une réunion",
  MEETING_UPDATED: "a modifié une réunion",
  MEETING_CANCELLED: "a annulé une réunion",
  MEETING_ARCHIVED: "a archivé une réunion",
  ATTENDANCE_RECORDED: "a enregistré une présence",
  ATTENDANCE_CORRECTED: "a corrigé une présence",
  MINUTES_CREATED: "a ouvert un procès-verbal",
  MINUTES_UPDATED: "a modifié un procès-verbal",
  MINUTES_SUBMITTED: "a soumis un procès-verbal",
  MINUTES_VALIDATED: "a validé un procès-verbal",
  DECISION_RECORDED: "a consigné une décision",
  ACTION_CREATED: "a créé une action",
  ACTION_UPDATED: "a modifié une action",
  ACTION_CLOSED: "a clôturé une action",
  DOCUMENT_UPLOADED: "a déposé un document",
  DOCUMENT_DELETED: "a supprimé un document",
};

export async function getManagementActivity(limit = 8): Promise<ActivityEntry[]> {
  const logs = await prisma.auditLog.findMany({
    where: { action: { in: Object.keys(MANAGEMENT_ACTIVITY_LABELS) as AuditAction[] } },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      action: true,
      createdAt: true,
      actor: { select: { name: true } },
    },
  });

  return logs.map((log) => ({
    id: log.id,
    label: MANAGEMENT_ACTIVITY_LABELS[log.action] ?? "a effectué une action",
    actor: log.actor?.name ?? null,
    createdAt: log.createdAt,
  }));
}
