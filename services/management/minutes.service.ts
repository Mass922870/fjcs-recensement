import { prisma } from "@/lib/db";
import { isDemoDataVisible } from "@/lib/demo-data";
import { NotFoundError, ValidationError } from "@/lib/errors";
import { audit } from "@/services/audit.service";
import { MINUTES_TRANSITIONS, type MinutesInput } from "@/schemas/management/minutes";
import type { MinutesStatus } from "@/lib/generated/prisma/enums";

/** États dans lesquels le contenu du procès-verbal reste librement modifiable. */
const EDITABLE: MinutesStatus[] = ["BROUILLON", "EN_REVISION", "A_VALIDER"];

export async function getOrCreateMinutes(meetingId: string, actorId: string) {
  const existing = await prisma.minutes.findUnique({ where: { meetingId }, select: { id: true } });
  if (existing) return existing;

  const meeting = await prisma.meeting.findUnique({
    where: { id: meetingId },
    select: { id: true, status: true, organizerId: true },
  });
  if (!meeting) throw new NotFoundError("Réunion introuvable.");
  if (meeting.status === "ANNULEE") {
    throw new ValidationError("Une réunion annulée n'a pas de procès-verbal.");
  }

  const minutes = await prisma.minutes.create({
    data: { meetingId, chairId: meeting.organizerId },
    select: { id: true },
  });
  await audit({
    action: "MINUTES_CREATED",
    entityType: "Minutes",
    entityId: minutes.id,
    actorId,
    metadata: { meetingId },
  });
  return minutes;
}

export async function getMinutes(meetingId: string) {
  const minutes = await prisma.minutes.findUnique({
    where: { meetingId },
    select: {
      id: true,
      status: true,
      introduction: true,
      proceedings: true,
      observations: true,
      misc: true,
      conclusion: true,
      version: true,
      validatedAt: true,
      updatedAt: true,
      chair: { select: { id: true, firstName: true, lastName: true, role: true } },
      secretary: { select: { id: true, firstName: true, lastName: true, role: true } },
      versions: {
        orderBy: { version: "desc" },
        select: { id: true, version: true, reason: true, createdAt: true, authorId: true },
      },
      meeting: {
        select: {
          id: true,
          reference: true,
          title: true,
          type: true,
          startsAt: true,
          endsAt: true,
          location: true,
          commission: { select: { name: true } },
          agenda: {
            orderBy: { position: "asc" },
            select: { id: true, position: true, title: true, description: true, discussion: true },
          },
          participants: {
            select: {
              member: { select: { id: true, firstName: true, lastName: true, role: true } },
            },
          },
          attendances: {
            select: {
              status: true,
              member: { select: { id: true, firstName: true, lastName: true, role: true } },
            },
          },
          decisions: {
            orderBy: { position: "asc" },
            select: { id: true, agendaItemId: true, title: true, description: true },
          },
        },
      },
    },
  });
  if (!minutes) throw new NotFoundError("Procès-verbal introuvable.");
  return minutes;
}

export type MinutesDetail = Awaited<ReturnType<typeof getMinutes>>;

/** Instantané figé, conservé à chaque validation. */
function snapshot(minutes: MinutesDetail) {
  return {
    status: minutes.status,
    introduction: minutes.introduction,
    proceedings: minutes.proceedings,
    observations: minutes.observations,
    misc: minutes.misc,
    conclusion: minutes.conclusion,
    chair: minutes.chair ? `${minutes.chair.firstName} ${minutes.chair.lastName}` : null,
    secretary: minutes.secretary
      ? `${minutes.secretary.firstName} ${minutes.secretary.lastName}`
      : null,
    points: minutes.meeting.agenda.map((a) => ({
      title: a.title,
      discussion: a.discussion,
      decisions: minutes.meeting.decisions
        .filter((d) => d.agendaItemId === a.id)
        .map((d) => d.title),
    })),
    attendances: minutes.meeting.attendances.map((a) => ({
      member: `${a.member.firstName} ${a.member.lastName}`,
      status: a.status,
    })),
  };
}

export async function saveMinutes(meetingId: string, input: MinutesInput, actorId: string) {
  const minutes = await prisma.minutes.findUnique({
    where: { meetingId },
    select: { id: true, status: true },
  });
  if (!minutes) throw new NotFoundError("Procès-verbal introuvable.");
  if (!EDITABLE.includes(minutes.status)) {
    throw new ValidationError(
      "Ce procès-verbal est validé : ouvrez une nouvelle version pour le reprendre.",
    );
  }

  const agendaIds = new Set(
    (await prisma.agendaItem.findMany({ where: { meetingId }, select: { id: true } })).map(
      (a) => a.id,
    ),
  );
  if (input.points.some((p) => !agendaIds.has(p.agendaItemId))) {
    throw new ValidationError("Un point du compte rendu ne correspond plus à l'ordre du jour.");
  }

  await prisma.$transaction([
    prisma.minutes.update({
      where: { id: minutes.id },
      data: {
        chairId: input.chairId ?? null,
        secretaryId: input.secretaryId ?? null,
        introduction: input.introduction ?? null,
        proceedings: input.proceedings ?? null,
        observations: input.observations ?? null,
        misc: input.misc ?? null,
        conclusion: input.conclusion ?? null,
      },
    }),
    ...input.points.map((point) =>
      prisma.agendaItem.update({
        where: { id: point.agendaItemId },
        data: { discussion: point.discussion ?? null },
      }),
    ),
    // Les décisions du PV sont remplacées en bloc : celles rattachées à un
    // point disparu suivent la suppression du point via la cascade.
    prisma.decision.deleteMany({ where: { meetingId, agendaItemId: { in: [...agendaIds] } } }),
    ...input.points
      .filter((p) => p.decision)
      .map((point, index) =>
        prisma.decision.create({
          data: {
            meetingId,
            agendaItemId: point.agendaItemId,
            title: point.decision!,
            position: index,
          },
        }),
      ),
  ]);

  await audit({
    action: "MINUTES_UPDATED",
    entityType: "Minutes",
    entityId: minutes.id,
    actorId,
    metadata: { meetingId, points: input.points.length },
  });
}

/**
 * Fait avancer le procès-verbal dans son cycle de vie.
 *
 * La validation fige une version : le contenu devient non modifiable et
 * toute reprise ultérieure créera la version suivante.
 */
export async function transitionMinutes(
  meetingId: string,
  status: MinutesStatus,
  actorId: string,
) {
  const minutes = await getMinutes(meetingId);
  const allowed = MINUTES_TRANSITIONS[minutes.status];
  if (!allowed.includes(status)) {
    throw new ValidationError(
      `Transition impossible : un procès-verbal « ${minutes.status.toLowerCase()} » ne peut pas passer directement à « ${status.toLowerCase()} ».`,
    );
  }

  if (status === "VALIDE") {
    if (!minutes.chair || !minutes.secretary) {
      throw new ValidationError(
        "Désignez le président et le secrétaire de séance avant de valider.",
      );
    }
    await prisma.$transaction([
      prisma.minutesVersion.create({
        data: {
          minutesId: minutes.id,
          version: minutes.version,
          content: snapshot(minutes),
          authorId: actorId,
          reason: "Validation",
        },
      }),
      prisma.minutes.update({
        where: { id: minutes.id },
        data: { status, validatedAt: new Date(), validatedById: actorId },
      }),
    ]);
  } else {
    await prisma.minutes.update({ where: { id: minutes.id }, data: { status } });
  }

  await audit({
    action:
      status === "VALIDE"
        ? "MINUTES_VALIDATED"
        : status === "ARCHIVE"
          ? "MINUTES_ARCHIVED"
          : "MINUTES_SUBMITTED",
    entityType: "Minutes",
    entityId: minutes.id,
    actorId,
    metadata: { meetingId, status, version: minutes.version },
  });
}

/**
 * Ouvre une nouvelle version d'un procès-verbal validé.
 *
 * La version en vigueur reste archivée telle quelle : c'est ce qui rend la
 * reprise traçable plutôt que silencieuse.
 */
export async function openNewVersion(meetingId: string, reason: string, actorId: string) {
  const minutes = await prisma.minutes.findUnique({
    where: { meetingId },
    select: { id: true, status: true, version: true },
  });
  if (!minutes) throw new NotFoundError("Procès-verbal introuvable.");
  if (minutes.status !== "VALIDE" && minutes.status !== "ARCHIVE") {
    throw new ValidationError("Seul un procès-verbal validé donne lieu à une nouvelle version.");
  }

  await prisma.minutes.update({
    where: { id: minutes.id },
    data: {
      status: "EN_REVISION",
      version: minutes.version + 1,
      validatedAt: null,
      validatedById: null,
    },
  });

  await prisma.minutesVersion.updateMany({
    where: { minutesId: minutes.id, version: minutes.version },
    data: { reason: `${reason}` },
  });

  await audit({
    action: "MINUTES_UPDATED",
    entityType: "Minutes",
    entityId: minutes.id,
    actorId,
    metadata: { meetingId, newVersion: minutes.version + 1, reason },
  });
}

export async function listMinutes() {
  const rows = await prisma.minutes.findMany({
    where: { meeting: isDemoDataVisible() ? {} : { isDemo: false } },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      status: true,
      version: true,
      updatedAt: true,
      validatedAt: true,
      secretary: { select: { firstName: true, lastName: true } },
      meeting: { select: { id: true, reference: true, title: true, startsAt: true, type: true } },
    },
  });
  return rows;
}

export type MinutesRow = Awaited<ReturnType<typeof listMinutes>>[number];
