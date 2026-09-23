import { createHash, randomBytes } from "node:crypto";
import { prisma } from "@/lib/db";
import { isDemoDataVisible } from "@/lib/demo-data";
import { NotFoundError, ValidationError } from "@/lib/errors";
import { audit } from "@/services/audit.service";
import type { AttendanceEntryInput } from "@/schemas/management/attendance";
import type { AttendanceStatus } from "@/lib/generated/prisma/enums";

/** Statuts comptant comme une présence effective : un retard reste une présence. */
const PRESENT_STATUSES: AttendanceStatus[] = ["PRESENT", "RETARD"];

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Combine le jour de la séance avec une heure saisie au format HH:mm. */
function timeOnDay(day: Date, time: string | undefined): Date | null {
  if (!time) return null;
  const d = new Date(day);
  const [h, m] = time.split(":").map(Number);
  d.setHours(h ?? 0, m ?? 0, 0, 0);
  return d;
}

export async function getAttendanceSheet(meetingId: string) {
  const meeting = await prisma.meeting.findUnique({
    where: { id: meetingId },
    select: {
      id: true,
      reference: true,
      title: true,
      type: true,
      status: true,
      startsAt: true,
      endsAt: true,
      location: true,
      participants: {
        select: {
          member: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              role: true,
              commission: { select: { name: true } },
            },
          },
        },
      },
      attendances: {
        select: {
          memberId: true,
          status: true,
          method: true,
          arrivedAt: true,
          leftAt: true,
          comment: true,
          updatedAt: true,
          recordedBy: { select: { name: true } },
        },
      },
    },
  });
  if (!meeting) throw new NotFoundError("Réunion introuvable.");

  const byMember = new Map(meeting.attendances.map((a) => [a.memberId, a]));
  const rows = meeting.participants
    .map((p) => ({ member: p.member, attendance: byMember.get(p.member.id) ?? null }))
    .sort((a, b) =>
      `${a.member.lastName} ${a.member.firstName}`.localeCompare(
        `${b.member.lastName} ${b.member.firstName}`,
        "fr",
      ),
    );

  const counts = {
    expected: rows.length,
    present: rows.filter((r) => r.attendance?.status === "PRESENT").length,
    late: rows.filter((r) => r.attendance?.status === "RETARD").length,
    excused: rows.filter((r) => r.attendance?.status === "EXCUSE").length,
    absent: rows.filter((r) => r.attendance?.status === "ABSENT").length,
    unmarked: rows.filter((r) => !r.attendance).length,
  };
  const rate = counts.expected ? Math.round(((counts.present + counts.late) / counts.expected) * 1000) / 10 : null;

  return { meeting, rows, counts, rate };
}

export type AttendanceSheet = Awaited<ReturnType<typeof getAttendanceSheet>>;

/**
 * Enregistre ou corrige les présences d'une séance.
 *
 * Une correction manuelle écrase toujours un pointage par QR : le responsable
 * reste l'autorité finale, comme le veut le cahier des charges.
 */
export async function saveAttendances(
  meetingId: string,
  entries: AttendanceEntryInput[],
  actorId: string,
) {
  const meeting = await prisma.meeting.findUnique({
    where: { id: meetingId },
    select: {
      id: true,
      startsAt: true,
      participants: { select: { memberId: true } },
    },
  });
  if (!meeting) throw new NotFoundError("Réunion introuvable.");

  const convoked = new Set(meeting.participants.map((p) => p.memberId));
  const unknown = entries.find((e) => !convoked.has(e.memberId));
  if (unknown) {
    throw new ValidationError("Un membre pointé n'est pas convoqué à cette séance.");
  }

  const corrections = await prisma.attendance.count({
    where: { meetingId, method: "QR_CODE", memberId: { in: entries.map((e) => e.memberId) } },
  });

  await prisma.$transaction(
    entries.map((entry) => {
      const data = {
        status: entry.status,
        method: "MANUEL" as const,
        arrivedAt: timeOnDay(meeting.startsAt, entry.arrivedAt),
        leftAt: timeOnDay(meeting.startsAt, entry.leftAt),
        comment: entry.comment ?? null,
        recordedById: actorId,
      };
      return prisma.attendance.upsert({
        where: { meetingId_memberId: { meetingId, memberId: entry.memberId } },
        create: { meetingId, memberId: entry.memberId, ...data },
        update: data,
      });
    }),
  );

  await audit({
    action: corrections > 0 ? "ATTENDANCE_CORRECTED" : "ATTENDANCE_RECORDED",
    entityType: "Meeting",
    entityId: meetingId,
    actorId,
    metadata: { count: entries.length, corrections },
  });
}

// ---------------------------------------------------------------------------
//  Pointage par QR code
// ---------------------------------------------------------------------------

/**
 * Émet un jeton de pointage et révoque les précédents.
 *
 * La valeur en clair n'est retournée qu'ici, une seule fois : seule son
 * empreinte est conservée. L'identifiant de réunion ne sert jamais de jeton,
 * sans quoi n'importe qui pourrait fabriquer un QR valide.
 */
export async function issueAttendanceToken(
  meetingId: string,
  ttlMinutes: number,
  actorId: string,
) {
  const meeting = await prisma.meeting.findUnique({
    where: { id: meetingId },
    select: { id: true, status: true },
  });
  if (!meeting) throw new NotFoundError("Réunion introuvable.");
  if (meeting.status === "ANNULEE" || meeting.status === "ARCHIVEE") {
    throw new ValidationError("Cette réunion n'accepte plus de pointage.");
  }

  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + ttlMinutes * 60_000);

  await prisma.$transaction([
    prisma.attendanceToken.updateMany({
      where: { meetingId, revokedAt: null },
      data: { revokedAt: new Date() },
    }),
    prisma.attendanceToken.create({
      data: { tokenHash: hashToken(token), meetingId, expiresAt, createdById: actorId },
    }),
  ]);

  await audit({
    action: "ATTENDANCE_TOKEN_ISSUED",
    entityType: "Meeting",
    entityId: meetingId,
    actorId,
    metadata: { ttlMinutes },
  });

  return { token, expiresAt };
}

export async function revokeAttendanceTokens(meetingId: string, actorId: string) {
  const { count } = await prisma.attendanceToken.updateMany({
    where: { meetingId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  if (count > 0) {
    await audit({
      action: "ATTENDANCE_TOKEN_REVOKED",
      entityType: "Meeting",
      entityId: meetingId,
      actorId,
    });
  }
  return count;
}

export async function hasActiveToken(meetingId: string): Promise<boolean> {
  const active = await prisma.attendanceToken.findFirst({
    where: { meetingId, revokedAt: null, expiresAt: { gt: new Date() } },
    select: { id: true },
  });
  return Boolean(active);
}

export interface ScanContext {
  meeting: { id: string; title: string; startsAt: Date; location: string | null };
  expiresAt: Date;
  /** Convoqués dont la présence n'est pas encore enregistrée. */
  pending: { id: string; firstName: string; lastName: string }[];
  alreadyMarked: number;
}

/**
 * Résout un jeton scanné. Ne renvoie que les noms des convoqués : aucune
 * coordonnée personnelle ne transite par cette page, qui n'est pas protégée
 * par un mot de passe.
 */
export async function resolveAttendanceToken(token: string): Promise<ScanContext> {
  const row = await prisma.attendanceToken.findUnique({
    where: { tokenHash: hashToken(token) },
    select: {
      expiresAt: true,
      revokedAt: true,
      meeting: {
        select: {
          id: true,
          title: true,
          startsAt: true,
          location: true,
          status: true,
          participants: {
            select: { member: { select: { id: true, firstName: true, lastName: true } } },
          },
          attendances: { select: { memberId: true } },
        },
      },
    },
  });

  if (!row) throw new NotFoundError("Ce QR code n'est pas valide.");
  if (row.revokedAt) throw new ValidationError("Ce QR code a été révoqué par un responsable.");
  if (row.expiresAt <= new Date()) throw new ValidationError("Ce QR code a expiré.");
  if (row.meeting.status === "ANNULEE" || row.meeting.status === "ARCHIVEE") {
    throw new ValidationError("Cette réunion n'accepte plus de pointage.");
  }

  const marked = new Set(row.meeting.attendances.map((a) => a.memberId));
  return {
    meeting: {
      id: row.meeting.id,
      title: row.meeting.title,
      startsAt: row.meeting.startsAt,
      location: row.meeting.location,
    },
    expiresAt: row.expiresAt,
    pending: row.meeting.participants
      .map((p) => p.member)
      .filter((m) => !marked.has(m.id))
      .sort((a, b) => `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`, "fr")),
    alreadyMarked: marked.size,
  };
}

/**
 * Enregistre une présence scannée.
 *
 * Le statut dépend de l'heure : au-delà de quinze minutes après l'ouverture,
 * la présence est marquée en retard plutôt que d'être laissée à l'appréciation.
 */
export async function confirmAttendanceByToken(token: string, memberId: string) {
  const context = await resolveAttendanceToken(token);
  if (!context.pending.some((m) => m.id === memberId)) {
    throw new ValidationError(
      "Votre présence est déjà enregistrée, ou vous n'êtes pas convoqué à cette séance.",
    );
  }

  const now = new Date();
  const lateAfter = new Date(context.meeting.startsAt.getTime() + 15 * 60_000);

  await prisma.attendance.create({
    data: {
      meetingId: context.meeting.id,
      memberId,
      status: now > lateAfter ? "RETARD" : "PRESENT",
      method: "QR_CODE",
      arrivedAt: now,
    },
  });

  await audit({
    action: "ATTENDANCE_RECORDED",
    entityType: "Meeting",
    entityId: context.meeting.id,
    metadata: { method: "QR_CODE" },
  });

  const member = context.pending.find((m) => m.id === memberId)!;
  return {
    meetingTitle: context.meeting.title,
    memberName: `${member.firstName} ${member.lastName}`,
    at: now,
    late: now > lateAfter,
  };
}

// ---------------------------------------------------------------------------
//  Vue d'ensemble
// ---------------------------------------------------------------------------

/** Séances récentes avec leur taux de présence, pour la page Présences. */
export async function listAttendanceOverview(limit = 30) {
  const meetings = await prisma.meeting.findMany({
    where: {
      ...(isDemoDataVisible() ? {} : { isDemo: false }),
      status: { in: ["EN_COURS", "TERMINEE", "PLANIFIEE"] },
    },
    orderBy: { startsAt: "desc" },
    take: limit,
    select: {
      id: true,
      reference: true,
      title: true,
      type: true,
      status: true,
      startsAt: true,
      _count: { select: { participants: true } },
      attendances: { select: { status: true } },
    },
  });

  return meetings.map((m) => {
    const present = m.attendances.filter((a) => PRESENT_STATUSES.includes(a.status)).length;
    const expected = m._count.participants;
    return {
      id: m.id,
      reference: m.reference,
      title: m.title,
      type: m.type,
      status: m.status,
      startsAt: m.startsAt,
      expected,
      marked: m.attendances.length,
      present,
      rate: expected ? Math.round((present / expected) * 1000) / 10 : null,
    };
  });
}

export type AttendanceOverviewRow = Awaited<ReturnType<typeof listAttendanceOverview>>[number];
