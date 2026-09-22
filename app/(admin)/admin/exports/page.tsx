import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/page-header";
import { GlobalFilters } from "@/components/admin/global-filters";
import { DemoBanner } from "@/components/admin/demo-banner";
import { ExportPanel } from "@/components/admin/exports/export-panel";
import { requirePagePermission } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/rbac";
import { parseStatsFilters } from "@/schemas/filters";
import { getDashboardKpis } from "@/services/stats.service";
import { getFormReferentials } from "@/services/referentials.service";

export const metadata: Metadata = { title: "Exports" };

export default async function ExportsPage(props: PageProps<"/admin/exports">) {
  const user = await requirePagePermission("export:aggregated");
  const sp = await props.searchParams;
  const filters = parseStatsFilters(sp);
  const [referentials, kpis] = await Promise.all([
    getFormReferentials(),
    getDashboardKpis(filters),
  ]);

  return (
    <>
      <PageHeader
        title="Exports"
        description="Extraire les données filtrées au format CSV ou Excel."
      />
      <DemoBanner />
      <GlobalFilters filters={filters} referentials={referentials}
        show={["from", "to", "quartier", "gender", "age", "employment", "education", "skill"]}
      />
      <ExportPanel
        canExportPersonal={hasPermission(user.role, "export:personal")}
        matching={kpis.total}
      />
    </>
  );
}
