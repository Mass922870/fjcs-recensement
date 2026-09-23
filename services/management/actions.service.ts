import { addDays, endOfDay, startOfToday } from "date-fns";
import { prisma } from "@/lib/db";
import { isDemoDataVisible } from "@/lib/demo-data";
import { NotFoundError, ValidationError } from "@/lib/errors";
import { audit } from "@/services/audit.service";
import type { ActionFilters, ActionItemInput } from "@/schemas/management/actions";
import type { ActionStatus } from "@/lib/generated/prisma/enums";
import type { Prisma } from "@/lib/generated/prisma/client";
import { KANBAN_COLUMNS } from "@/lib/constants/management";

export { KANBAN_COLUMNS };

const OPEN_STATUSES: ActionStatus[] = ["A_FAIRE", "EN_COURS", "BLOQUE"];

function demoFilter(): { isDemo?: false } {
  return isDemoDataVisible() ? {} : { isDemo: false };
}

function buildWhere(filters: ActionFilters): Prisma.ActionItemWhereInput {
  const today = startOfToday();
  const horizon =
    filters.due === "semaine"
      ? endOfDay(addDays(today, 7))
      : filters.due === "mois"
        ? endOfDay(addDays(today, 30))
        : null;

  return {
    ...demoFilter(),
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.priority ? { priority: filters.priority } : {}),
    ...(filters.assigneeId ? { assigneeId: filters.assigneeId } : {}),
    ...(filters.commissionId ? { commissionId: filters.commissionId } : {}),
    ...(filters.due === "retard"
      ? { status: { in: OPEN_STATUSES }, dueDate: { lt: today } }
      : horizon
        ? { dueDate: { not: null, lte: horizon } }
        : {}),
    ...(filters.q
      ? {
          OR: [
            { title: { contains: filters.q, mode: "insensitive" } },
            { description: { contains: filters.q, mode: "insensitive" } },
          ],
        }
      : {}),
  };
}

export async function listActions(filters: ActionFilters) {
  const rows = await prisma.actionItem.findMany({
    where: buildWhere(filters),
    orderBy: [{ position: "asc" }, { createdAt: "desc" }],
    select: {
      id: true,
      title: true,
      description: true,
      dueDate: true,
      priority: true,
      status: true,
      position: true,
      completedAt: true,
      assignee: { select: { id: true, firstName: true, lastName: true } },
      commission: { select: { id: true, name: true } },
      meeting: { select: { id: true, reference: true, title: true } },
      decision: { select: { id: true, title: true } },
    },
  });

  const today = startOfToday();
  return rows.map((a) => ({
    ...a,
    overdue: a.dueDate != null && a.dueDate < today && a.status !== "TERMINE",
  }));
}

export type ActionRow = Awaited<ReturnType<typeof listActions>>[number];

export async function getActionStats() {
  const today = startOfToday();
  const where = demoFilter();
  const [byStatus, overdue, dueSoon] = await Promise.all([
    prisma.actionItem.groupBy({ by: ["status"], _count: { _all: true }, where }),
    prisma.actionItem.count({
      where: { ...where, status: { in: OPEN_STATUSES }, dueDate: { lt: today } },
    }),
    prisma.actionItem.count({
      where: {
        ...where,
        status: { in: OPEN_STATUSES },
        dueDate: { gte: today, lte: endOfDay(addDays(today, 7)) },
      },
    }),
  ]);
  const count = (status: ActionStatus) =>
    byStatus.find((row) => row.status === status)?._count._all ?? 0;
  return {
    todo: count("A_FAIRE"),
    inProgress: count("EN_COURS"),
    blocked: count("BLOQUE"),
    done: count("TERMINE"),
    overdue,
    dueSoon,
  };
}

async function assertReferences(input: ActionItemInput) {
  if (input.assigneeId) {
    const m = await prisma.member.findUnique({
      where: { id: input.assigneeId },
      select: { id: true },
    });
    if (!m) throw new ValidationError("Responsable introuvable.", { assigneeId: ["Introuvable."] });
  }
  if (input.commissionId) {
    const c = await prisma.commission.findUnique({
      where: { id: input.commissionId },
      select: { id: true },
    });
    if (!c) throw new ValidationError("Commission introuvable.", { commissionId: ["Introuvable."] });
  }
}

/** Rang suivant dans la colonne visée, pour l'insertion en fin de liste. */
async function nextPosition(status: ActionStatus): Promise<number> {
  const last = await prisma.actionItem.findFirst({
    where: { status },
    orderBy: { position: "desc" },
    select: { position: true },
  });
  return (last?.position ?? -1) + 1;
}

export async function createAction(input: ActionItemInput, actorId: string) {
  await assertReferences(input);
  const action = await prisma.actionItem.create({
    data: {
      title: input.title,
      description: input.description,
      assigneeId: input.assigneeId,
      commissionId: input.commissionId,
      dueDate: input.dueDate,
      priority: input.priority,
      status: input.status,
      position: await nextPosition(input.status),
      meetingId: input.meetingId,
      decisionId: input.decisionId,
      completedAt: input.status === "TERMINE" ? new Date() : null,
    },
    select: { id: true },
  });
  await audit({
    action: "ACTION_CREATED",
    entityType: "ActionItem",
    entityId: action.id,
    actorId,
    metadata: { priority: input.priority, status: input.status },
  });
  return action;
}

export async function updateAction(id: string, input: ActionItemInput, actorId: string) {
  const existing = await prisma.actionItem.findUnique({
    where: { id },
    select: { id: true, status: true, completedAt: true },
  });
  if (!existing) throw new NotFoundError("Action introuvable.");
  await assertReferences(input);

  const becomingDone = input.status === "TERMINE" && existing.status !== "TERMINE";
  const leavingDone = input.status !== "TERMINE" && existing.status === "TERMINE";

  await prisma.actionItem.update({
    where: { id },
    data: {
      title: input.title,
      description: input.description ?? null,
      assigneeId: input.assigneeId ?? null,
      commissionId: input.commissionId ?? null,
      dueDate: input.dueDate ?? null,
      priority: input.priority,
      status: input.status,
      // La date d'achèvement suit le statut, sans jamais être saisie à la main.
      completedAt: becomingDone ? new Date() : leavingDone ? null : existing.completedAt,
    },
  });

  await audit({
    action: becomingDone ? "ACTION_CLOSED" : "ACTION_UPDATED",
    entityType: "ActionItem",
    entityId: id,
    actorId,
    metadata: { status: input.status },
  });
}

/**
 * Déplace une action dans le Kanban.
 *
 * Les rangs des voisins sont recalculés dans la colonne d'arrivée : sans cela,
 * deux actions finiraient par partager la même position et l'ordre deviendrait
 * instable d'un rechargement à l'autre.
 */
export async function moveAction(
  id: string,
  status: ActionStatus,
  position: number,
  actorId: string,
) {
  const action = await prisma.actionItem.findUnique({
    where: { id },
    select: { id: true, status: true, completedAt: true },
  });
  if (!action) throw new NotFoundError("Action introuvable.");

  const siblings = await prisma.actionItem.findMany({
    where: { status, id: { not: id } },
    orderBy: { position: "asc" },
    select: { id: true },
  });
  const ordered = [...siblings.map((s) => s.id)];
  ordered.splice(Math.min(position, ordered.length), 0, id);

  const becomingDone = status === "TERMINE" && action.status !== "TERMINE";
  const leavingDone = status !== "TERMINE" && action.status === "TERMINE";

  await prisma.$transaction([
    prisma.actionItem.update({
      where: { id },
      data: {
        status,
        completedAt: becomingDone ? new Date() : leavingDone ? null : action.completedAt,
      },
    }),
    ...ordered.map((actionId, index) =>
      prisma.actionItem.update({ where: { id: actionId }, data: { position: index } }),
    ),
  ]);

  await audit({
    action: becomingDone ? "ACTION_CLOSED" : "ACTION_UPDATED",
    entityType: "ActionItem",
    entityId: id,
    actorId,
    metadata: { status, position },
  });
}

export async function deleteAction(id: string, actorId: string) {
  const action = await prisma.actionItem.findUnique({ where: { id }, select: { id: true } });
  if (!action) throw new NotFoundError("Action introuvable.");
  await prisma.actionItem.delete({ where: { id } });
  await audit({ action: "ACTION_UPDATED", entityType: "ActionItem", entityId: id, actorId, metadata: { deleted: true } });
}

// ---------------------------------------------------------------------------
//  Décisions
// ---------------------------------------------------------------------------

export async function listDecisions(meetingId: string) {
  return prisma.decision.findMany({
    where: { meetingId },
    orderBy: { position: "asc" },
    select: {
      id: true,
      title: true,
      description: true,
      agendaItem: { select: { id: true, position: true, title: true } },
      actions: { select: { id: true, title: true, status: true } },
    },
  });
}

export type DecisionRow = Awaited<ReturnType<typeof listDecisions>>[number];

/** Transforme une décision en action de suivi, en reprenant son intitulé. */
export async function createActionFromDecision(
  decisionId: string,
  input: Omit<ActionItemInput, "decisionId" | "meetingId">,
  actorId: string,
) {
  const decision = await prisma.decision.findUnique({
    where: { id: decisionId },
    select: { id: true, meetingId: true },
  });
  if (!decision) throw new NotFoundError("Décision introuvable.");
  return createAction(
    { ...input, decisionId: decision.id, meetingId: decision.meetingId },
    actorId,
  );
}
