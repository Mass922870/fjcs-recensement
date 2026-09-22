import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { MapPinOff, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { GlobalFilters } from "@/components/admin/global-filters";
import { DemoBanner } from "@/components/admin/demo-banner";
import { QuartierMapLazy } from "@/components/admin/map/quartier-map-lazy";
import { MapLegend } from "@/components/admin/map/map-legend";
import { Skeleton } from "@/components/ui/skeleton";
import { requirePagePermission } from "@/lib/auth/session";
import { parseStatsFilters, type StatsFilters } from "@/schemas/filters";
import { getQuartierAggregates } from "@/services/stats.service";
import { getFormReferentials } from "@/services/referentials.service";

export const metadata: Metadata = { title: "Cartographie" };

export default async function MapPage(props: PageProps<"/admin/cartographie">) {
  await requirePagePermission("map:view");
  const sp = await props.searchParams;
  const filters = parseStatsFilters(sp);
  const referentials = await getFormReferentials();

  return (
    <>
      <PageHeader
        title="Cartographie"
        description="Où sont les jeunes ? Effectifs agrégés par quartier du village de Sangalkam."
      />
      <DemoBanner />
      <GlobalFilters filters={filters} referentials={referentials}
        show={["age", "gender", "employment", "skill", "need"]}
      />
      <Suspense
        key={JSON.stringify(filters)}
        fallback={<Skeleton className="h-[520px] w-full rounded-2xl" />}
      >
        <MapContent filters={filters} />
      </Suspense>
    </>
  );
}

async function MapContent({ filters }: { filters: StatsFilters }) {
  const data = await getQuartierAggregates(filters);
  const unlocated = data.filter((q) => q.latitude == null || q.longitude == null);
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      {unlocated.length ? (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 lg:col-span-2">
          <MapPinOff className="mt-0.5 size-4 shrink-0" />
          <p>
            {unlocated.length} quartier{unlocated.length > 1 ? "s" : ""} sans coordonnées ({unlocated.map((q) => q.name).join(", ")}) :
            ils n'apparaissent pas sur la carte mais restent comptés dans la liste. Renseignez latitude et longitude dans{" "}
            <Link href="/admin/parametres/referentiels?tab=quartier" className="font-medium underline underline-offset-2">
              Paramètres › Référentiels › Quartiers
            </Link>
            .
          </p>
        </div>
      ) : null}
      <div className="border-border overflow-hidden rounded-2xl border bg-white p-2">
        <QuartierMapLazy data={data} />
        <p className="text-muted-foreground flex items-center gap-2 px-3 py-2.5 text-xs">
          <ShieldCheck className="size-3.5 text-green-600" />
          Aucune position individuelle n'est affichée : uniquement des agrégats par quartier, placés
          au centre approximatif de chaque zone.
        </p>
      </div>
      <aside className="border-border rounded-2xl border bg-white p-5">
        <MapLegend data={data} />
      </aside>
    </div>
  );
}
