import { prisma } from "@/lib/db";
import { isDemoDataVisible } from "@/lib/demo-data";
import type { MeetingType } from "@/lib/generated/prisma/enums";

function demoFilter(): { isDemo?: false } {
  return isDemoDataVisible() ? {} : { isDemo: false };
}

export interface ArchiveFilters {
  year?: number;
  type?: MeetingType;
  commissionId?: string;
  q?: string;
}

/** Années pour lesquelles il existe au moins une séance. */
export async function listArchiveYears(): Promise<number[]> {
  const rows = await prisma.meeting.findMany({
    where: demoFilter(),
    select: { startsAt: true },
    orderBy: { startsAt: "desc" },
  });
  return [...new Set(rows.map((r) => r.startsAt.getFullYear()))];
}

/** Retire les accents d'une chaîne côté application. */
function deaccent(value: string): string {
  return value.normalize("NFD").replace(/\p{Diacritic}/gu, "");
}

/**
 * Identifiants des séances dont le texte correspond, accents ignorés.
 *
 * `translate` est une fonction native de PostgreSQL : contrairement à
 * l'extension `unaccent`, elle ne demande aucune installation et fonctionne
 * donc à l'identique en local et sur l'hébergement managé.
 */
async function matchingIds(q: string): Promise<string[]> {
  const needle = `%${deaccent(q).toLowerCase()}%`;
  const rows = await prisma.$queryRaw<{ id: string }[]>`
    SELECT DISTINCT m."id"
    FROM "Meeting" m
    LEFT JOIN "AgendaItem" a ON a."meetingId" = m."id"
    LEFT JOIN "Decision" d ON d."meetingId" = m."id"
    WHERE translate(lower(m."title" || ' ' || m."reference" || ' ' || coalesce(m."location", '')),
                    'àáâãäçèéêëìíîïñòóôõöùúûüýÿ', 'aaaaaceeeeiiiinooooouuuuyy') LIKE ${needle}
       OR translate(lower(coalesce(a."title", '')),
                    'àáâãäçèéêëìíîïñòóôõöùúûüýÿ', 'aaaaaceeeeiiiinooooouuuuyy') LIKE ${needle}
       OR translate(lower(coalesce(d."title", '')),
                    'àáâãäçèéêëìíîïñòóôõöùúûüýÿ', 'aaaaaceeeeiiiinooooouuuuyy') LIKE ${needle}
  `;
  return rows.map((r) => r.id);
}

/**
 * Recherche transversale dans les archives.
 *
 * Elle porte sur les séances passées : intitulé, référence, lieu, points de
 * l'ordre du jour et décisions consignées, pour retrouver un dossier sans en
 * connaître la date.
 */
export async function searchArchives(filters: ArchiveFilters) {
  const q = filters.q?.trim();
  const ids = q ? await matchingIds(q) : null;
  if (ids && ids.length === 0) return [];

  const meetings = await prisma.meeting.findMany({
    where: {
      ...demoFilter(),
      ...(filters.type ? { type: filters.type } : {}),
      ...(filters.commissionId ? { commissionId: filters.commissionId } : {}),
      ...(filters.year
        ? {
            startsAt: {
              gte: new Date(`${filters.year}-01-01T00:00:00`),
              lte: new Date(`${filters.year}-12-31T23:59:59`),
            },
          }
        : {}),
      ...(ids ? { id: { in: ids } } : {}),
    },
    orderBy: { startsAt: "desc" },
    take: 100,
    select: {
      id: true,
      reference: true,
      title: true,
      type: true,
      status: true,
      startsAt: true,
      commission: { select: { name: true } },
      minutes: { select: { id: true, status: true, version: true } },
      _count: { select: { documents: true, decisions: true, agenda: true } },
    },
  });

  return meetings;
}

export type ArchiveRow = Awaited<ReturnType<typeof searchArchives>>[number];
