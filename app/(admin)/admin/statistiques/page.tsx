import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PageHeader } from "@/components/admin/page-header";
import { GlobalFilters } from "@/components/admin/global-filters";
import { DemoBanner } from "@/components/admin/demo-banner";
import { ChartCard, ChartCardSkeleton } from "@/components/admin/chart-card";
import { CrossTabControls } from "@/components/admin/stats/cross-tab-controls";
import { CrossTabTable } from "@/components/admin/stats/cross-tab-table";
import { StackedBars } from "@/components/admin/charts/stacked-bars";
import { requirePagePermission } from "@/lib/auth/session";
import { parseStatsFilters, type StatsFilters } from "@/schemas/filters";
import { getCrossTab } from "@/services/stats.service";
import { CROSS_DIMENSIONS, type CrossDimension } from "@/lib/constants/stats";
import { getFormReferentials } from "@/services/referentials.service";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Statistiques avancées" };

/** Analyses prédéfinies du cahier des charges. */
const PRESETS: {
  label: string;
  x: CrossDimension;
  y: CrossDimension;
  filters?: Partial<StatsFilters>;
}[] = [
  { label: "Emploi par niveau d'études", x: "education", y: "employment" },
  { label: "Chômage par tranche d'âge", x: "age", y: "employment" },
  { label: "Compétences par quartier", x: "quartier", y: "skillCategory" },
  { label: "Besoins de formation par niveau d'études", x: "education", y: "need" },
  { label: "Entrepreneuriat par tranche d'âge", x: "age", y: "project" },
  { label: "Femmes / hommes par situation", x: "employment", y: "gender" },
  { label: "Projet + besoin de financement", x: "project", y: "need" },
  {
    label: "Compétences numériques par quartier",
    x: "quartier",
    y: "skillCategory",
    filters: { skill: "dev-web" },
  },
];

function isDim(v: unknown): v is CrossDimension {
  return typeof v === "string" && v in CROSS_DIMENSIONS;
}

export default async function StatsPage(props: PageProps<"/admin/statistiques">) {
  await requirePagePermission("stats:view");
  const sp = await props.searchParams;
  const filters = parseStatsFilters(sp);
  const x: CrossDimension = isDim(sp.x) ? sp.x : "education";
  let y: CrossDimension = isDim(sp.y) ? sp.y : "employment";
  if (y === x) y = x === "gender" ? "employment" : "gender";
  const referentials = await getFormReferentials();

  const presetHref = (p: (typeof PRESETS)[number]) => {
    const params = new URLSearchParams({ x: p.x, y: p.y });
    for (const [k, v] of Object.entries(p.filters ?? {})) if (v) params.set(k, String(v));
    return `/admin/statistiques?${params.toString()}`;
  };

  return (
    <>
      <PageHeader
        title="Statistiques avancées"
        description="Croisez deux dimensions pour comprendre qui a besoin de quoi, où et dans quelle situation."
      />
      <DemoBanner />
      <GlobalFilters filters={filters} referentials={referentials}
        show={[
          "from",
          "to",
          "gender",
          "age",
          "quartier",
          "education",
          "employment",
          "skill",
          "need",
        ]}
      />

      <div className="border-border mb-6 rounded-2xl border bg-white p-4">
        <p className="text-foreground mb-3 text-sm font-medium">Analyses prédéfinies</p>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => {
            const active =
              p.x === x && p.y === y && (!p.filters?.skill || filters.skill === p.filters.skill);
            return (
              <Link
                key={p.label}
                href={presetHref(p)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                  active
                    ? "border-brand-600 bg-brand-50 text-brand-800"
                    : "border-border text-muted-foreground hover:border-brand-200 hover:text-foreground",
                )}
              >
                {p.label}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="border-border mb-6 rounded-2xl border bg-white p-4">
        <p className="text-foreground mb-3 text-sm font-medium">Croisement personnalisé</p>
        <CrossTabControls x={x} y={y} />
      </div>

      <Suspense
        key={JSON.stringify({ x, y, filters })}
        fallback={
          <div className="grid gap-4">
            <ChartCardSkeleton />
            <ChartCardSkeleton />
          </div>
        }
      >
        <CrossTabResult x={x} y={y} filters={filters} />
      </Suspense>
    </>
  );
}

async function CrossTabResult({
  x,
  y,
  filters,
}: {
  x: CrossDimension;
  y: CrossDimension;
  filters: StatsFilters;
}) {
  const data = await getCrossTab(x, y, filters);
  const title = `${CROSS_DIMENSIONS[x]} × ${CROSS_DIMENSIONS[y]}`;
  return (
    <div className="grid gap-4">
      <ChartCard
        title={title}
        description="Effectifs et part de chaque ligne. Teinte plus foncée = effectif plus élevé."
      >
        <CrossTabTable data={data} />
      </ChartCard>
      <ChartCard
        title="Lecture graphique"
        description={`Une barre par ${CROSS_DIMENSIONS[x].toLowerCase()}, un segment par ${CROSS_DIMENSIONS[y].toLowerCase()}.`}
      >
        <StackedBars data={data} />
      </ChartCard>
    </div>
  );
}
