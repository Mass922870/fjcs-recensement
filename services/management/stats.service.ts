import { startOfMonth } from "date-fns";
import { prisma } from "@/lib/db";
import { isDemoDataVisible } from "@/lib/demo-data";
import type { AttendanceStatus, MeetingType } from "@/lib/generated/prisma/enums";

/** Un retard reste une présence effective dans tous les taux. */
const PRESENT: AttendanceStatus[] = ["PRESENT", "RETARD"];

function demoFilter(): { isDemo?: false } {
  return isDemoDataVisible() ? {} : { isDemo: false };
}

export interface ManagementStatsFilters {
  from?: Date;
  to?: Date;
  commissionId?: string;
  type?: MeetingType;
}

/** Séances retenues par les filtres, avec leurs présences. */
async function loadMeetings(filters: ManagementStatsFilters) {
  return prisma.meeting.findMany({
    where: {
      ...demoFilter(),
      status: { in: ["TERMINEE", "EN_COURS", "ARCHIVEE"] },
      ...(filters.commissionId ? { commissionId: filters.commissionId } : {}),
      ...(filters.type ? { type: filters.type } : {}),
      ...(filters.from || filters.to
        ? { startsAt: { ...(filters.from ? { gte: filters.from } : {}), ...(filters.to ? { lte: filters.to } : {}) } }
        : {}),
    },
    orderBy: { startsAt: "asc" },
    select: {
      id: true,
      title: true,
      type: true,
      startsAt: true,
      commission: { select: { id: true, name: true } },
      _count: { select: { participants: true } },
      attendances: {
        select: {
          status: true,
          member: { select: { id: true, firstName: true, lastName: true, commission: { select: { name: true } } } },
        },
      },
    },
  });
}

const rate = (present: number, total: number) =>
  total > 0 ? Math.round((present / total) * 1000) / 10 : null;

export async function getAttendanceStats(filters: ManagementStatsFilters) {
  const all = await loadMeetings(filters);

  // Seules les séances effectivement pointées entrent dans les taux. Compter
  // une réunion dont personne n'a rempli la feuille écraserait la moyenne à
  // zéro et donnerait une image fausse de l'assiduité du bureau.
  const meetings = all.filter((m) => m.attendances.length > 0);
  const unrecorded = all.length - meetings.length;

  let expected = 0;
  let present = 0;
  let late = 0;
  let absent = 0;
  let excused = 0;

  for (const m of meetings) {
    expected += m._count.participants;
    for (const a of m.attendances) {
      if (a.status === "PRESENT") present++;
      else if (a.status === "RETARD") late++;
      else if (a.status === "ABSENT") absent++;
      else if (a.status === "EXCUSE") excused++;
    }
  }

  // Évolution mensuelle sur les douze derniers mois disponibles.
  const byMonth = new Map<string, { present: number; expected: number }>();
  for (const m of meetings) {
    const key = startOfMonth(m.startsAt).toISOString().slice(0, 7);
    const entry = byMonth.get(key) ?? { present: 0, expected: 0 };
    entry.expected += m._count.participants;
    entry.present += m.attendances.filter((a) => PRESENT.includes(a.status)).length;
    byMonth.set(key, entry);
  }
  const monthly = [...byMonth.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([month, v]) => ({ month, rate: rate(v.present, v.expected) ?? 0, meetings: 0 }));

  // Par commission.
  const byCommission = new Map<string, { present: number; expected: number }>();
  for (const m of meetings) {
    const key = m.commission?.name ?? "Sans commission";
    const entry = byCommission.get(key) ?? { present: 0, expected: 0 };
    entry.expected += m._count.participants;
    entry.present += m.attendances.filter((a) => PRESENT.includes(a.status)).length;
    byCommission.set(key, entry);
  }

  // Par membre : assiduité individuelle.
  const byMember = new Map<string, { name: string; present: number; total: number }>();
  for (const m of meetings) {
    for (const a of m.attendances) {
      const entry = byMember.get(a.member.id) ?? {
        name: `${a.member.lastName} ${a.member.firstName}`,
        present: 0,
        total: 0,
      };
      entry.total++;
      if (PRESENT.includes(a.status)) entry.present++;
      byMember.set(a.member.id, entry);
    }
  }

  const members = [...byMember.values()]
    .map((m) => ({ ...m, rate: rate(m.present, m.total) ?? 0 }))
    .sort((a, b) => b.rate - a.rate || b.present - a.present);

  const meetingRates = meetings
    .map((m) => ({
      id: m.id,
      title: m.title,
      startsAt: m.startsAt,
      rate: rate(m.attendances.filter((a) => PRESENT.includes(a.status)).length, m._count.participants),
    }))
    .filter((m) => m.rate !== null)
    .sort((a, b) => (b.rate ?? 0) - (a.rate ?? 0));

  return {
    totals: {
      meetings: meetings.length,
      /** Séances retenues par les filtres mais jamais pointées. */
      unrecorded,
      expected,
      present,
      late,
      absent,
      excused,
      rate: rate(present + late, expected),
    },
    monthly,
    byCommission: [...byCommission.entries()]
      .map(([name, v]) => ({ name, rate: rate(v.present, v.expected) ?? 0 }))
      .sort((a, b) => b.rate - a.rate),
    topMembers: members.slice(0, 8),
    lowMembers: [...members].reverse().slice(0, 5),
    topMeetings: meetingRates.slice(0, 5),
  };
}

export type ManagementStats = Awaited<ReturnType<typeof getAttendanceStats>>;
