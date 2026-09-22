import { startOfMonth, startOfWeek } from "date-fns";
import { prisma } from "@/lib/db";
import type { Prisma } from "@/lib/generated/prisma/client";
import type { Gender } from "@/lib/generated/prisma/enums";
import { AGE_BRACKETS, GENDER_LABELS, SYSTEM_SLUGS, type AgeBracketKey } from "@/lib/constants/referentials";
import { ageBracketOf, birthDateRangeForBracket, computeAge } from "@/lib/age";
import { isDemoDataVisible } from "@/lib/demo-data";
import type { StatsFilters } from "@/schemas/filters";

// ---------------------------------------------------------------------------
// Filtre commun - UNIQUE source de vérité pour KPI, graphiques, carto, exports
// ---------------------------------------------------------------------------

export function buildProfileWhere(filters: StatsFilters = {}): Prisma.YouthProfileWhereInput {
  const where: Prisma.YouthProfileWhereInput = { status: "ACTIVE" };
  if (!isDemoDataVisible()) where.isDemo = false;

  if (filters.from || filters.to) {
    where.createdAt = {};
    if (filters.from) where.createdAt.gte = new Date(`${filters.from}T00:00:00`);
    if (filters.to) where.createdAt.lte = new Date(`${filters.to}T23:59:59.999`);
  }
  if (filters.gender) where.gender = filters.gender;
  if (filters.age) {
    const range = birthDateRangeForBracket(filters.age as AgeBracketKey);
    where.birthDate = { gte: range.gte, lte: range.lte };
  }
  if (filters.quartier) where.quartier = { slug: filters.quartier };
  if (filters.education) where.education = { level: { slug: filters.education } };
  if (filters.employment) where.employment = { status: { slug: filters.employment } };
  if (filters.skill) where.skills = { some: { skill: { slug: filters.skill } } };
  if (filters.need) where.needs = { some: { need: { slug: filters.need } } };
  return where;
}

// ---------------------------------------------------------------------------
// KPI
// ---------------------------------------------------------------------------

export interface DashboardKpis {
  total: number;
  newThisWeek: number;
  newThisMonth: number;
  entrepreneurs: number;
  students: number;
  jobSeekers: number;
  wantTraining: number;
}

export async function getDashboardKpis(filters: StatsFilters = {}): Promise<DashboardKpis> {
  const where = buildProfileWhere(filters);
  const now = new Date();
  const [total, newThisWeek, newThisMonth, entrepreneurs, students, jobSeekers, wantTraining] =
    await Promise.all([
      prisma.youthProfile.count({ where }),
      prisma.youthProfile.count({
        where: { AND: [where, { createdAt: { gte: startOfWeek(now, { weekStartsOn: 1 }) } }] },
      }),
      prisma.youthProfile.count({
        where: { AND: [where, { createdAt: { gte: startOfMonth(now) } }] },
      }),
      prisma.youthProfile.count({
        where: { AND: [where, { employment: { status: { kind: "ENTREPRENEUR" } } }] },
      }),
      prisma.youthProfile.count({
        where: { AND: [where, { employment: { status: { kind: "STUDENT" } } }] },
      }),
      prisma.youthProfile.count({
        where: { AND: [where, { employment: { status: { kind: "JOB_SEEKER" } } }] },
      }),
      prisma.youthProfile.count({
        where: { AND: [where, { needs: { some: { need: { slug: SYSTEM_SLUGS.NEED_TRAINING } } } }] },
      }),
    ]);
  return { total, newThisWeek, newThisMonth, entrepreneurs, students, jobSeekers, wantTraining };
}

// ---------------------------------------------------------------------------
// Distributions
// ---------------------------------------------------------------------------

export interface DistributionRow {
  key: string;
  label: string;
  value: number;
}

export interface Distributions {
  gender: DistributionRow[];
  age: DistributionRow[];
  employment: DistributionRow[];
  education: DistributionRow[];
  quartier: DistributionRow[];
  skills: DistributionRow[];
  needs: DistributionRow[];
  interests: DistributionRow[];
}

async function ageDistribution(where: Prisma.YouthProfileWhereInput): Promise<DistributionRow[]> {
  const rows = await prisma.youthProfile.findMany({ where, select: { birthDate: true } });
  const counts = new Map<AgeBracketKey, number>();
  for (const r of rows) {
    const k = ageBracketOf(computeAge(r.birthDate));
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  return AGE_BRACKETS.map((b) => ({ key: b.key, label: b.label, value: counts.get(b.key) ?? 0 }));
}

export async function getDistributions(filters: StatsFilters = {}): Promise<Distributions> {
  const where = buildProfileWhere(filters);

  const [gender, age, employment, education, quartier, skills, needs, interests] =
    await Promise.all([
      prisma.youthProfile.groupBy({ by: ["gender"], where, _count: { _all: true } }),
      ageDistribution(where),
      prisma.employment.groupBy({ by: ["statusId"], where: { youth: where }, _count: { _all: true } }),
      prisma.education.groupBy({ by: ["levelId"], where: { youth: where }, _count: { _all: true } }),
      prisma.youthProfile.groupBy({ by: ["quartierId"], where, _count: { _all: true } }),
      prisma.youthSkill.groupBy({
        by: ["skillId"],
        where: { youth: where },
        _count: { _all: true },
        orderBy: { _count: { skillId: "desc" } },
        take: 10,
      }),
      prisma.youthNeed.groupBy({
        by: ["needId"],
        where: { youth: where },
        _count: { _all: true },
        orderBy: { _count: { needId: "desc" } },
      }),
      prisma.youthInterest.groupBy({
        by: ["interestId"],
        where: { youth: where },
        _count: { _all: true },
        orderBy: { _count: { interestId: "desc" } },
        take: 10,
      }),
    ]);

  const [quartierRefs, skillRefs, needRefs, interestRefs, levelRefs, statusRefs] = await Promise.all([
    prisma.quartier.findMany({ select: { id: true, name: true, sortOrder: true } }),
    prisma.skill.findMany({ select: { id: true, label: true } }),
    prisma.need.findMany({ select: { id: true, label: true } }),
    prisma.interest.findMany({ select: { id: true, label: true } }),
    prisma.educationLevel.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, slug: true, label: true } }),
    prisma.employmentStatus.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, slug: true, label: true } }),
  ]);
  const qName = new Map(quartierRefs.map((q) => [q.id, q.name]));
  const sLabel = new Map(skillRefs.map((s) => [s.id, s.label]));
  const nLabel = new Map(needRefs.map((n) => [n.id, n.label]));
  const iLabel = new Map(interestRefs.map((i) => [i.id, i.label]));

  const genderMap = new Map(gender.map((g) => [g.gender, g._count._all]));
  const employmentMap = new Map(employment.map((e) => [e.statusId, e._count._all]));
  const educationMap = new Map(education.map((e) => [e.levelId, e._count._all]));

  return {
    gender: (Object.keys(GENDER_LABELS) as Gender[]).map((g) => ({
      key: g,
      label: GENDER_LABELS[g],
      value: genderMap.get(g) ?? 0,
    })),
    age,
    employment: statusRefs.map((st) => ({ key: st.slug, label: st.label, value: employmentMap.get(st.id) ?? 0 })),
    education: levelRefs.map((l) => ({ key: l.slug, label: l.label, value: educationMap.get(l.id) ?? 0 })),
    quartier: quartier
      .map((q) => ({
        key: q.quartierId ?? "unknown",
        label: q.quartierId ? (qName.get(q.quartierId) ?? "Inconnu") : "Non renseigné",
        value: q._count._all,
      }))
      .sort((a, b) => b.value - a.value),
    skills: skills.map((s) => ({
      key: s.skillId,
      label: sLabel.get(s.skillId) ?? "?",
      value: s._count._all,
    })),
    needs: needs.map((n) => ({
      key: n.needId,
      label: nLabel.get(n.needId) ?? "?",
      value: n._count._all,
    })),
    interests: interests.map((i) => ({
      key: i.interestId,
      label: iLabel.get(i.interestId) ?? "?",
      value: i._count._all,
    })),
  };
}

// ---------------------------------------------------------------------------
// Statistiques croisées
// ---------------------------------------------------------------------------

export {
  CROSS_DIMENSIONS,
  MULTI_VALUED_DIMENSIONS,
  type CrossDimension,
} from "@/lib/constants/stats";
import type { CrossDimension } from "@/lib/constants/stats";

interface AnalyticRow {
  gender: Gender;
  birthDate: Date;
  quartier: { name: string; sortOrder: number } | null;
  education: { level: { label: string; sortOrder: number } } | null;
  employment: { status: { label: string; sortOrder: number } } | null;
  project: { isFormalized: boolean } | null;
  skills: { skill: { category: { label: string; sortOrder: number } } }[];
  needs: { need: { label: string; sortOrder: number } }[];
  interests: { interest: { label: string; sortOrder: number } }[];
}

interface Category {
  key: string;
  label: string;
  order: number;
}

function categoriesOf(row: AnalyticRow, dim: CrossDimension): Category[] {
  switch (dim) {
    case "gender":
      return [
        {
          key: row.gender,
          label: GENDER_LABELS[row.gender],
          order: row.gender === "FEMALE" ? 0 : 1,
        },
      ];
    case "age": {
      const k = ageBracketOf(computeAge(row.birthDate));
      const idx = AGE_BRACKETS.findIndex((b) => b.key === k);
      return [{ key: k, label: AGE_BRACKETS[idx]!.label, order: idx }];
    }
    case "quartier":
      return [
        row.quartier
          ? { key: row.quartier.name, label: row.quartier.name, order: row.quartier.sortOrder }
          : { key: "-", label: "Non renseigné", order: 999 },
      ];
    case "education":
      return [
        row.education
          ? { key: row.education.level.label, label: row.education.level.label, order: row.education.level.sortOrder }
          : { key: "-", label: "Non renseigné", order: 999 },
      ];
    case "employment":
      return [
        row.employment
          ? { key: row.employment.status.label, label: row.employment.status.label, order: row.employment.status.sortOrder }
          : { key: "-", label: "Non renseigné", order: 999 },
      ];
    case "need":
      return row.needs.map((n) => ({
        key: n.need.label,
        label: n.need.label,
        order: n.need.sortOrder,
      }));
    case "skillCategory": {
      const cats = new Map(row.skills.map((s) => [s.skill.category.label, s.skill.category]));
      return [...cats.values()].map((c) => ({ key: c.label, label: c.label, order: c.sortOrder }));
    }
    case "interest":
      return row.interests.map((i) => ({
        key: i.interest.label,
        label: i.interest.label,
        order: i.interest.sortOrder,
      }));
    case "project":
      if (!row.project) return [{ key: "none", label: "Sans activité déclarée", order: 2 }];
      return row.project.isFormalized
        ? [{ key: "formal", label: "Activité formalisée", order: 0 }]
        : [{ key: "informal", label: "Activité informelle", order: 1 }];
  }
}

export interface CrossTab {
  rowDimension: CrossDimension;
  colDimension: CrossDimension;
  rows: string[];
  cols: string[];
  /** cells[rowLabel][colLabel] = effectif */
  cells: Record<string, Record<string, number>>;
  rowTotals: Record<string, number>;
  colTotals: Record<string, number>;
  total: number;
}

export async function getCrossTab(
  rowDim: CrossDimension,
  colDim: CrossDimension,
  filters: StatsFilters = {},
): Promise<CrossTab> {
  const where = buildProfileWhere(filters);
  const data = await prisma.youthProfile.findMany({
    where,
    select: {
      gender: true,
      birthDate: true,
      quartier: { select: { name: true, sortOrder: true } },
      education: { select: { level: { select: { label: true, sortOrder: true } } } },
      employment: { select: { status: { select: { label: true, sortOrder: true } } } },
      project: { select: { isFormalized: true } },
      skills: { select: { skill: { select: { category: { select: { label: true, sortOrder: true } } } } } },
      needs: { select: { need: { select: { label: true, sortOrder: true } } } },
      interests: { select: { interest: { select: { label: true, sortOrder: true } } } },
    },
  });

  const rowCats = new Map<string, Category>();
  const colCats = new Map<string, Category>();
  const cells: Record<string, Record<string, number>> = {};
  const rowTotals: Record<string, number> = {};
  const colTotals: Record<string, number> = {};

  for (const r of data) {
    const rc = categoriesOf(r, rowDim);
    const cc = categoriesOf(r, colDim);
    for (const a of rc) {
      rowCats.set(a.label, a);
      cells[a.label] ??= {};
      for (const b of cc) {
        colCats.set(b.label, b);
        cells[a.label]![b.label] = (cells[a.label]![b.label] ?? 0) + 1;
        rowTotals[a.label] = (rowTotals[a.label] ?? 0) + 1;
        colTotals[b.label] = (colTotals[b.label] ?? 0) + 1;
      }
    }
  }

  const sortCats = (m: Map<string, Category>) =>
    [...m.values()]
      .sort((a, b) => a.order - b.order || a.label.localeCompare(b.label, "fr"))
      .map((c) => c.label);

  return {
    rowDimension: rowDim,
    colDimension: colDim,
    rows: sortCats(rowCats),
    cols: sortCats(colCats),
    cells,
    rowTotals,
    colTotals,
    total: data.length,
  };
}

// ---------------------------------------------------------------------------
// Cartographie - agrégats par quartier uniquement (jamais de position individuelle)
// ---------------------------------------------------------------------------

export interface QuartierAggregate {
  id: string;
  name: string;
  slug: string;
  latitude: number | null;
  longitude: number | null;
  count: number;
}

export async function getQuartierAggregates(
  filters: StatsFilters = {},
): Promise<QuartierAggregate[]> {
  const where = buildProfileWhere(filters);
  const [groups, quartiers] = await Promise.all([
    prisma.youthProfile.groupBy({ by: ["quartierId"], where, _count: { _all: true } }),
    prisma.quartier.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true, slug: true, latitude: true, longitude: true },
    }),
  ]);
  const counts = new Map(groups.map((g) => [g.quartierId, g._count._all]));
  return quartiers.map((q) => ({ ...q, count: counts.get(q.id) ?? 0 }));
}
