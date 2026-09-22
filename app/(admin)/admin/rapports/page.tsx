import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/page-header";
import { GlobalFilters } from "@/components/admin/global-filters";
import { DemoBanner } from "@/components/admin/demo-banner";
import { ReportPanel } from "@/components/admin/reports/report-panel";
import { requirePagePermission } from "@/lib/auth/session";
import { parseStatsFilters } from "@/schemas/filters";
import { getDashboardKpis } from "@/services/stats.service";
import { getFormReferentials } from "@/services/referentials.service";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export const metadata: Metadata = { title: "Rapports" };

export default async function ReportsPage(props: PageProps<"/admin/rapports">) {
  await requirePagePermission("reports:generate");
  const sp = await props.searchParams;
  const filters = parseStatsFilters(sp);
  const [referentials, kpis] = await Promise.all([
    getFormReferentials(),
    getDashboardKpis(filters),
  ]);
  const fmt = (d: string) => format(new Date(`${d}T00:00:00`), "d MMM yyyy", { locale: fr });
  const periodLabel =
    filters.from && filters.to
      ? `Du ${fmt(filters.from)} au ${fmt(filters.to)}`
      : filters.from
        ? `Depuis le ${fmt(filters.from)}`
        : filters.to
          ? `Jusqu'au ${fmt(filters.to)}`
          : "Toute la période";

  return (
    <>
      <PageHeader
        title="Rapports"
        description="Générer un rapport général sur une période, avec statistiques, graphiques et conclusion."
      />
      <DemoBanner />
      <GlobalFilters filters={filters} referentials={referentials}
        show={["from", "to", "quartier", "gender", "age"]}
      />
      <ReportPanel matching={kpis.total} periodLabel={periodLabel} />
    </>
  );
}
