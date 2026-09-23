import { endOfDay, startOfDay } from "date-fns";
import { prisma } from "@/lib/db";
import { isDemoDataVisible } from "@/lib/demo-data";
import { NotFoundError, ValidationError } from "@/lib/errors";
import { audit } from "@/services/audit.service";
import { combineDateTime, type MeetingFilters, type MeetingInput } from "@/schemas/management/meetings";
import type { Prisma } from "@/lib/generated/prisma/client";

export const MEETINGS_PAGE_SIZE = 20;

/** Statuts pour lesquels la séance est encore modifiable. */
const EDITABLE_STATUSES = ["PLANIFIEE", "EN_COURS"];

function demoFilter(): { isDemo?: false } {
  return isDemoDataVisible() ? {} : { isDemo: false };
}

/**
 * Référence lisible de la forme REU-2026-0007, unique par année.
 *
 * Calculée à partir du rang de la dernière référence de l'année plutôt que
 * d'un simple comptage : une réunion supprimée ne doit pas libérer un numéro
 * déjà communiqué dans une convocation.
 */
async function nextReference(year: number): Promise<string> {
  const prefix = `REU-${year}-`;
  const last = await prisma.meeting.findFirst({
    where: { reference: { startsWith: prefix } },
    orderBy: { reference: "desc" },
    select: { reference: true },
  });
  const rank = last ? Number(last.reference.slice(prefix.length)) + 1 : 1;
  return `${prefix}${String(rank).padStart(4, "0")}`;
}

function buildWhere(filters: MeetingFilters): Prisma.MeetingWhereInput {
  return {
    ...demoFilter(),
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.type ? { type: filters.type } : {}),
    ...(filters.commissionId ? { commissionId: filters.commissionId } : {}),
    ...(filters.organizerId ? { organizerId: filters.organizerId } : {}),
    ...(filters.from || filters.to
      ? {
          startsAt: {
            ...(filters.from ? { gte: startOfDay(new Date(filters.from)) } : {}),
            ...(filters.to ? { lte: endOfDay(new Date(filters.to)) } : {}),
          },
        }
      : {}),
    ...(filters.q
      ? {
          OR: [
            { title: { contains: filters.q, mode: "insensitive" } },
            { reference: { contains: filters.q, mode: "insensitive" } },
            { location: { contains: filters.q, mode: "insensitive" } },
          ],
        }
      : {}),
  };
}

const ORDER: Record<MeetingFilters["sort"], Prisma.MeetingOrderByWithRelationInput> = {
  "date-desc": { startsAt: "desc" },
  "date-asc": { startsAt: "asc" },
  title: { title: "asc" },
};

export async function listMeetings(filters: MeetingFilters) {
  const where = buildWhere(filters);
  const [total, rows] = await Promise.all([
    prisma.meeting.count({ where }),
    prisma.meeting.findMany({
      where,
      orderBy: ORDER[filters.sort],
      skip: (filters.page - 1) * MEETINGS_PAGE_SIZE,
      take: MEETINGS_PAGE_SIZE,
      select: {
        id: true,
        reference: true,
        title: true,
        type: true,
        status: true,
        startsAt: true,
        endsAt: true,
        location: true,
        commission: { select: { id: true, name: true } },
        organizer: { select: { id: true, firstName: true, lastName: true } },
        _count: { select: { participants: true, agenda: true } },
      },
    }),
  ]);
  return { rows, total, pageCount: Math.max(1, Math.ceil(total / MEETINGS_PAGE_SIZE)) };
}

export type MeetingRow = Awaited<ReturnType<typeof listMeetings>>["rows"][number];

/** Séances d'une plage de dates, pour le calendrier. */
export async function listMeetingsInRange(from: Date, to: Date) {
  return prisma.meeting.findMany({
    where: { ...demoFilter(), startsAt: { gte: from, lte: to } },
    orderBy: { startsAt: "asc" },
    select: {
      id: true,
      reference: true,
      title: true,
      type: true,
      status: true,
      startsAt: true,
      endsAt: true,
      location: true,
      commission: { select: { name: true } },
    },
  });
}

export type CalendarMeeting = Awaited<ReturnType<typeof listMeetingsInRange>>[number];

export async function getMeeting(id: string) {
  const meeting = await prisma.meeting.findUnique({
    where: { id },
    select: {
      id: true,
      reference: true,
      title: true,
      type: true,
      status: true,
      startsAt: true,
      endsAt: true,
      location: true,
      description: true,
      cancelReason: true,
      createdAt: true,
      updatedAt: true,
      archivedAt: true,
      commission: { select: { id: true, name: true } },
      organizer: { select: { id: true, firstName: true, lastName: true, role: true } },
      createdBy: { select: { name: true } },
      agenda: {
        orderBy: { position: "asc" },
        select: { id: true, position: true, title: true, description: true, duration: true },
      },
      participants: {
        select: {
          id: true,
          required: true,
          member: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              role: true,
              status: true,
              commission: { select: { name: true } },
            },
          },
        },
      },
      _count: { select: { attendances: true, decisions: true, actions: true, documents: true } },
    },
  });
  if (!meeting) throw new NotFoundError("Réunion introuvable.");
  // Tri par nom fait ici : Prisma ne trie pas sur un champ de la relation imbriquée.
  meeting.participants.sort((a, b) =>
    `${a.member.lastName} ${a.member.firstName}`.localeCompare(
      `${b.member.lastName} ${b.member.firstName}`,
      "fr",
    ),
  );
  return meeting;
}

export type MeetingDetail = Awaited<ReturnType<typeof getMeeting>>;

/** Vérifie que commission, organisateur et participants existent réellement. */
async function assertReferences(input: MeetingInput) {
  if (input.commissionId) {
    const c = await prisma.commission.findUnique({
      where: { id: input.commissionId },
      select: { id: true },
    });
    if (!c) throw new ValidationError("Commission introuvable.", { commissionId: ["Introuvable."] });
  }
  if (input.organizerId) {
    const m = await prisma.member.findUnique({
      where: { id: input.organizerId },
      select: { id: true },
    });
    if (!m) throw new ValidationError("Organisateur introuvable.", { organizerId: ["Introuvable."] });
  }
  if (input.participantIds.length) {
    const found = await prisma.member.count({ where: { id: { in: input.participantIds } } });
    if (found !== input.participantIds.length) {
      throw new ValidationError("Un participant sélectionné n'existe plus.");
    }
  }
}

export async function createMeeting(input: MeetingInput, actorId: string) {
  await assertReferences(input);
  const startsAt = combineDateTime(input.date, input.startTime);
  const endsAt = input.endTime ? combineDateTime(input.date, input.endTime) : null;

  const meeting = await prisma.$transaction(async (tx) => {
    const reference = await nextReference(startsAt.getFullYear());
    return tx.meeting.create({
      data: {
        reference,
        title: input.title,
        type: input.type,
        startsAt,
        endsAt,
        location: input.location,
        description: input.description,
        commissionId: input.commissionId,
        organizerId: input.organizerId,
        createdById: actorId,
        agenda: {
          create: input.agenda.map((item, index) => ({
            position: index,
            title: item.title,
            description: item.description,
            duration: item.duration,
          })),
        },
        participants: {
          create: input.participantIds.map((memberId) => ({ memberId })),
        },
      },
      select: { id: true, reference: true },
    });
  });

  await audit({
    action: "MEETING_CREATED",
    entityType: "Meeting",
    entityId: meeting.id,
    actorId,
    metadata: { reference: meeting.reference, type: input.type },
  });
  return meeting;
}

export async function updateMeeting(id: string, input: MeetingInput, actorId: string) {
  const existing = await prisma.meeting.findUnique({
    where: { id },
    select: { id: true, status: true },
  });
  if (!existing) throw new NotFoundError("Réunion introuvable.");
  if (!EDITABLE_STATUSES.includes(existing.status)) {
    throw new ValidationError(
      "Cette réunion n'est plus modifiable : elle est terminée, annulée ou archivée.",
    );
  }
  await assertReferences(input);

  const startsAt = combineDateTime(input.date, input.startTime);
  const endsAt = input.endTime ? combineDateTime(input.date, input.endTime) : null;

  // L'ordre du jour et les convoqués sont remplacés en bloc : plus simple et
  // plus sûr qu'un différentiel, et sans effet de bord sur les présences, qui
  // vivent dans leur propre table.
  await prisma.$transaction([
    prisma.agendaItem.deleteMany({ where: { meetingId: id } }),
    prisma.meetingParticipant.deleteMany({
      where: { meetingId: id, memberId: { notIn: input.participantIds } },
    }),
    prisma.meeting.update({
      where: { id },
      data: {
        title: input.title,
        type: input.type,
        startsAt,
        endsAt,
        location: input.location ?? null,
        description: input.description ?? null,
        commissionId: input.commissionId ?? null,
        organizerId: input.organizerId ?? null,
        agenda: {
          create: input.agenda.map((item, index) => ({
            position: index,
            title: item.title,
            description: item.description,
            duration: item.duration,
          })),
        },
      },
    }),
    ...input.participantIds.map((memberId) =>
      prisma.meetingParticipant.upsert({
        where: { meetingId_memberId: { meetingId: id, memberId } },
        create: { meetingId: id, memberId },
        update: {},
      }),
    ),
  ]);

  await audit({ action: "MEETING_UPDATED", entityType: "Meeting", entityId: id, actorId });
}

/** Déplace une séance d'un jour à l'autre en conservant son horaire. */
export async function rescheduleMeeting(id: string, date: string, actorId: string) {
  const meeting = await prisma.meeting.findUnique({
    where: { id },
    select: { id: true, status: true, startsAt: true, endsAt: true },
  });
  if (!meeting) throw new NotFoundError("Réunion introuvable.");
  if (!EDITABLE_STATUSES.includes(meeting.status)) {
    throw new ValidationError("Seule une réunion planifiée ou en cours peut être déplacée.");
  }

  const shift = (d: Date) => {
    const next = new Date(`${date}T00:00:00`);
    next.setHours(d.getHours(), d.getMinutes(), 0, 0);
    return next;
  };

  await prisma.meeting.update({
    where: { id },
    data: { startsAt: shift(meeting.startsAt), endsAt: meeting.endsAt ? shift(meeting.endsAt) : null },
  });
  await audit({
    action: "MEETING_UPDATED",
    entityType: "Meeting",
    entityId: id,
    actorId,
    metadata: { rescheduledTo: date },
  });
}

export async function cancelMeeting(id: string, reason: string, actorId: string) {
  const meeting = await prisma.meeting.findUnique({
    where: { id },
    select: { id: true, status: true },
  });
  if (!meeting) throw new NotFoundError("Réunion introuvable.");
  if (meeting.status === "ANNULEE") throw new ValidationError("Cette réunion est déjà annulée.");
  await prisma.meeting.update({
    where: { id },
    data: { status: "ANNULEE", cancelReason: reason },
  });
  await audit({
    action: "MEETING_CANCELLED",
    entityType: "Meeting",
    entityId: id,
    actorId,
    metadata: { reason },
  });
}

export async function setMeetingStatus(
  id: string,
  status: "EN_COURS" | "TERMINEE" | "PLANIFIEE",
  actorId: string,
) {
  const meeting = await prisma.meeting.findUnique({
    where: { id },
    select: { id: true, status: true },
  });
  if (!meeting) throw new NotFoundError("Réunion introuvable.");
  if (meeting.status === "ARCHIVEE") {
    throw new ValidationError("Une réunion archivée ne change plus d'état.");
  }
  await prisma.meeting.update({ where: { id }, data: { status, cancelReason: null } });
  await audit({
    action: "MEETING_UPDATED",
    entityType: "Meeting",
    entityId: id,
    actorId,
    metadata: { status },
  });
}

export async function archiveMeeting(id: string, actorId: string) {
  const meeting = await prisma.meeting.findUnique({
    where: { id },
    select: { id: true, status: true },
  });
  if (!meeting) throw new NotFoundError("Réunion introuvable.");
  await prisma.meeting.update({
    where: { id },
    data: { status: "ARCHIVEE", archivedAt: new Date() },
  });
  await audit({ action: "MEETING_ARCHIVED", entityType: "Meeting", entityId: id, actorId });
}

/**
 * Suppression définitive, réservée aux séances sans trace exploitable.
 * Dès qu'une présence, une décision ou un PV existe, l'archivage s'impose.
 */
export async function deleteMeeting(id: string, actorId: string) {
  const meeting = await prisma.meeting.findUnique({
    where: { id },
    select: {
      id: true,
      reference: true,
      _count: { select: { attendances: true, decisions: true, actions: true, documents: true } },
      minutes: { select: { id: true } },
    },
  });
  if (!meeting) throw new NotFoundError("Réunion introuvable.");
  const { attendances, decisions, actions, documents } = meeting._count;
  if (attendances || decisions || actions || documents || meeting.minutes) {
    throw new ValidationError(
      "Cette réunion porte déjà des présences, décisions, actions ou un procès-verbal : archivez-la au lieu de la supprimer.",
    );
  }
  await prisma.meeting.delete({ where: { id } });
  await audit({
    action: "MEETING_ARCHIVED",
    entityType: "Meeting",
    entityId: id,
    actorId,
    metadata: { deleted: true, reference: meeting.reference },
  });
}

/** Membres proposés à la convocation : jamais les archivés. */
export async function listSelectableMembers() {
  return prisma.member.findMany({
    where: { status: { in: ["ACTIF", "INACTIF"] }, ...(isDemoDataVisible() ? {} : { isDemo: false }) },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    select: {
      id: true,
      firstName: true,
      lastName: true,
      role: true,
      status: true,
      commission: { select: { id: true, name: true } },
    },
  });
}

export type SelectableMember = Awaited<ReturnType<typeof listSelectableMembers>>[number];

/** Journal d'audit restreint à une séance, pour l'onglet Historique. */
export async function getMeetingHistory(meetingId: string) {
  return prisma.auditLog.findMany({
    where: { entityType: "Meeting", entityId: meetingId },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      action: true,
      createdAt: true,
      metadata: true,
      actor: { select: { name: true } },
    },
  });
}

export type MeetingHistoryEntry = Awaited<ReturnType<typeof getMeetingHistory>>[number];
