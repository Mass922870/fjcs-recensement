import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { prisma } from "@/lib/db";
import type { StatsFilters } from "@/schemas/filters";
import {
  buildProfileWhere,
  getDashboardKpis,
  getDistributions,
  type DashboardKpis,
  type Distributions,
} from "./stats.service";

export interface ReportData {
  generatedAt: Date;
  periodLabel: string;
  filters: StatsFilters;
  kpis: DashboardKpis;
  distributions: Distributions;
  entrepreneurship: {
    total: number;
    formalized: number;
    informal: number;
    topSectors: { label: string; value: number }[];
  };
  /** Conclusion descriptive - phrases construites uniquement à partir des chiffres ci-dessus. */
  narrative: string[];
}

const pct = (part: number, total: number) => (total ? Math.round((part / total) * 100) : 0);
const nf = new Intl.NumberFormat("fr-FR");

function periodLabel(f: StatsFilters): string {
  const fmt = (d: string) => format(new Date(`${d}T00:00:00`), "d MMMM yyyy", { locale: fr });
  if (f.from && f.to) return `Du ${fmt(f.from)} au ${fmt(f.to)}`;
  if (f.from) return `Depuis le ${fmt(f.from)}`;
  if (f.to) return `Jusqu'au ${fmt(f.to)}`;
  return "Toute la période de collecte";
}

function top(rows: { label: string; value: number }[], n = 3) {
  return rows
    .filter((r) => r.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, n);
}

function joinFr(items: string[]): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} et ${items[items.length - 1]}`;
}

function buildNarrative(
  k: DashboardKpis,
  d: Distributions,
  e: ReportData["entrepreneurship"],
): string[] {
  const total = k.total;
  if (total === 0)
    return [
      "Aucune donnée ne correspond à la période et aux filtres sélectionnés. Les statistiques apparaîtront dès que les premières données seront collectées.",
    ];

  const out: string[] = [];
  const women = d.gender.find((g) => g.key === "FEMALE")?.value ?? 0;
  const men = d.gender.find((g) => g.key === "MALE")?.value ?? 0;
  out.push(
    `Sur ${nf.format(total)} jeune${total > 1 ? "s" : ""} recensé${total > 1 ? "s" : ""}, ${pct(women, total)} % sont des femmes (${nf.format(women)}) et ${pct(men, total)} % des hommes (${nf.format(men)}).`,
  );

  const topAge = top(d.age, 1)[0];
  if (topAge)
    out.push(
      `La tranche d'âge la plus représentée est ${topAge.label} (${pct(topAge.value, total)} % des répondants).`,
    );

  const topQ = top(d.quartier, 3);
  if (topQ.length)
    out.push(
      `Les quartiers les plus représentés sont ${joinFr(topQ.map((q) => `${q.label} (${nf.format(q.value)})`))}.`,
    );

  const topEdu = top(d.education, 2);
  if (topEdu.length)
    out.push(
      `Côté formation, les niveaux dominants sont ${joinFr(topEdu.map((x) => `${x.label.toLowerCase()} (${pct(x.value, total)} %)`))}.`,
    );

  out.push(
    `En matière d'emploi, ${pct(k.jobSeekers, total)} % des jeunes sont demandeurs d'emploi (${nf.format(k.jobSeekers)}), ${pct(k.students, total)} % sont étudiants (${nf.format(k.students)}) et ${pct(k.entrepreneurs, total)} % se déclarent entrepreneurs (${nf.format(k.entrepreneurs)}).`,
  );

  if (e.total > 0) {
    out.push(
      `Parmi les ${nf.format(e.total)} activités entrepreneuriales déclarées, ${nf.format(e.formalized)} sont formalisées (${pct(e.formalized, e.total)} %) et ${nf.format(e.informal)} restent informelles${e.topSectors.length ? ` ; les secteurs les plus fréquents sont ${joinFr(e.topSectors.map((s) => s.label.toLowerCase()))}` : ""}.`,
    );
  }

  const topSkills = top(d.skills, 3);
  if (topSkills.length)
    out.push(
      `Les compétences les plus citées sont ${joinFr(topSkills.map((s) => `${s.label.toLowerCase()} (${nf.format(s.value)})`))}.`,
    );

  const topNeeds = top(d.needs, 3);
  if (topNeeds.length)
    out.push(
      `Les besoins les plus exprimés sont ${joinFr(topNeeds.map((n) => `${n.label.toLowerCase()} (${nf.format(n.value)})`))}. ${pct(k.wantTraining, total)} % des jeunes souhaitent suivre une formation.`,
    );

  const topInt = top(d.interests, 3);
  if (topInt.length)
    out.push(
      `Les centres d'intérêt dominants sont ${joinFr(topInt.map((i) => i.label.toLowerCase()))}.`,
    );

  return out;
}

export async function buildReport(filters: StatsFilters): Promise<ReportData> {
  const where = buildProfileWhere(filters);
  const [kpis, distributions, projects] = await Promise.all([
    getDashboardKpis(filters),
    getDistributions(filters),
    prisma.project.findMany({
      where: { youth: where },
      select: { sector: true, isFormalized: true },
    }),
  ]);

  const sectors = new Map<string, number>();
  for (const p of projects) sectors.set(p.sector, (sectors.get(p.sector) ?? 0) + 1);
  const entrepreneurship = {
    total: projects.length,
    formalized: projects.filter((p) => p.isFormalized).length,
    informal: projects.filter((p) => !p.isFormalized).length,
    topSectors: [...sectors.entries()]
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 3),
  };

  return {
    generatedAt: new Date(),
    periodLabel: periodLabel(filters),
    filters,
    kpis,
    distributions,
    entrepreneurship,
    narrative: buildNarrative(kpis, distributions, entrepreneurship),
  };
}
