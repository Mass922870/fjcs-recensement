import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/admin/page-header";
import { GlobalFilters } from "@/components/admin/global-filters";
import { DemoBanner } from "@/components/admin/demo-banner";
import { YouthToolbar } from "@/components/admin/youth/youth-toolbar";
import { YouthTable } from "@/components/admin/youth/youth-table";
import { Skeleton } from "@/components/ui/skeleton";
import { requirePagePermission } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/rbac";
import { parseYouthListParams } from "@/schemas/youth-list";
import { listYouthProfiles } from "@/services/youth-list.service";
import { getFormReferentials } from "@/services/referentials.service";

export const metadata: Metadata = { title: "Jeunes recensés" };

export default async function YouthListPage(props: PageProps<"/admin/jeunes">) {
  const user = await requirePagePermission("youth:read");
  const sp = await props.searchParams;
  const params = parseYouthListParams(sp);
  const referentials = await getFormReferentials();

  return (
    <>
      <PageHeader
        title="Jeunes recensés"
        description="Recherche, filtres, tri et accès aux fiches individuelles."
      />
      <DemoBanner />
      <GlobalFilters filters={params} referentials={referentials}
        show={["gender", "age", "quartier", "education", "employment", "skill", "from", "to"]}
      />
      <div className="mb-4">
        <YouthToolbar
          q={params.q}
          status={params.status ?? "ACTIVE"}
          canSeeArchived={hasPermission(user.role, "youth:archive")}
        />
      </div>
      <Suspense key={JSON.stringify(params)} fallback={<TableSkeleton />}>
        <Results params={params} sp={sp} />
      </Suspense>
    </>
  );
}

async function Results({
  params,
  sp,
}: {
  params: ReturnType<typeof parseYouthListParams>;
  sp: Record<string, string | string[] | undefined>;
}) {
  const result = await listYouthProfiles(params);
  return <YouthTable result={result} params={params} searchParams={sp} />;
}

function TableSkeleton() {
  return (
    <div className="border-border space-y-2 rounded-2xl border bg-white p-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  );
}
