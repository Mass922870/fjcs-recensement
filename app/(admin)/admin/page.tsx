import type { Metadata } from "next";
import { Suspense } from "react";
import {
  BriefcaseBusiness,
  CalendarDays,
  CalendarRange,
  GraduationCap,
  Lightbulb,
  Search,
  Users,
} from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { GlobalFilters } from "@/components/admin/global-filters";
import { DemoBanner } from "@/components/admin/demo-banner";
import { StatCard, StatCardSkeleton } from "@/components/admin/stat-card";
import { ChartCard, ChartCardSkeleton } from "@/components/admin/chart-card";
import { HorizontalBars } from "@/components/admin/charts/horizontal-bars";
import { Columns } from "@/components/admin/charts/columns";
import { ShareBar } from "@/components/admin/charts/share-bar";
import { requirePagePermission } from "@/lib/auth/session";
import { parseStatsFilters, type StatsFilters } from "@/schemas/filters";
import { getDashboardKpis, getDistributions } from "@/services/stats.service";
import { getFormReferentials } from "@/services/referentials.service";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage(props: PageProps<"/admin">) {
  await requirePagePermission("dashboard:view");
  const sp = await props.searchParams;
  const filters = parseStatsFilters(sp);
  const referentials = await getFormReferentials();
  const key = JSON.stringify(filters);

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Combien de jeunes, qui sont-ils, où sont-ils, que font-ils, de quoi ont-ils besoin ?"
      />
      <DemoBanner />
      <GlobalFilters filters={filters} referentials={referentials} />

      <Suspense key={`kpi-${key}`} fallback={<KpiSkeleton />}>
        <KpiRow filters={filters} />
      </Suspense>

      <Suspense key={`charts-${key}`} fallback={<ChartsSkeleton />}>
        <ChartsGrid filters={filters} />
      </Suspense>
    </>
  );
}

async function KpiRow({ filters }: { filters: StatsFilters }) {
  const k = await getDashboardKpis(filters);
  return (
    <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard label="Jeunes recensés" value={k.total} icon={Users} hint="Profils actifs" />
      <StatCard
        label="Nouveaux cette semaine"
        value={k.newThisWeek}
        icon={CalendarDays}
        accent="cyan"
        hint="Depuis lundi"
      />
      <StatCard
        label="Nouveaux ce mois"
        value={k.newThisMonth}
        icon={CalendarRange}
        accent="cyan"
        hint="Depuis le 1er du mois"
      />
      <StatCard label="Entrepreneurs" value={k.entrepreneurs} icon={Lightbulb} accent="green" />
      <StatCard label="Étudiants" value={k.students} icon={GraduationCap} />
      <StatCard label="Demandeurs d'emploi" value={k.jobSeekers} icon={Search} />
      <StatCard
        label="Souhaitent une formation"
        value={k.wantTraining}
        icon={BriefcaseBusiness}
        accent="green"
      />
    </div>
  );
}

async function ChartsGrid({ filters }: { filters: StatsFilters }) {
  const d = await getDistributions(filters);
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ChartCard title="Répartition par sexe">
        <ShareBar data={d.gender} />
      </ChartCard>
      <ChartCard title="Répartition par âge">
        <Columns data={d.age} />
      </ChartCard>
      <ChartCard title="Situation professionnelle">
        <HorizontalBars data={d.employment} color="var(--chart-2)" />
      </ChartCard>
      <ChartCard title="Niveau d'études">
        <HorizontalBars data={d.education} />
      </ChartCard>
      <ChartCard
        title="Répartition par quartier"
        description="Agrégats par zone - aucune position individuelle."
      >
        <HorizontalBars data={d.quartier} hideZero color="var(--chart-2)" />
      </ChartCard>
      <ChartCard
        title="Principales compétences"
        description="Top 10 - un jeune peut déclarer plusieurs compétences."
      >
        <HorizontalBars data={d.skills} color="var(--chart-3)" showPercent={false} />
      </ChartCard>
      <ChartCard title="Principaux besoins" description="Plusieurs réponses possibles par jeune.">
        <HorizontalBars data={d.needs} color="var(--chart-5)" showPercent={false} />
      </ChartCard>
      <ChartCard title="Centres d'intérêt" description="Top 10.">
        <HorizontalBars data={d.interests} color="var(--chart-4)" showPercent={false} />
      </ChartCard>
    </div>
  );
}

function KpiSkeleton() {
  return (
    <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 7 }).map((_, i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>
  );
}

function ChartsSkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {Array.from({ length: 8 }).map((_, i) => (
        <ChartCardSkeleton key={i} />
      ))}
    </div>
  );
}
