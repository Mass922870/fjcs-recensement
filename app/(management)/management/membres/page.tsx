import type { Metadata } from "next";
import { Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/admin/page-header";
import { EmptyState } from "@/components/shared/states";
import { Pagination } from "@/components/shared/pagination";
import { MemberFilters } from "@/components/management/members/member-filters";
import { MemberFormDialog } from "@/components/management/members/member-form-dialog";
import { MembersTable } from "@/components/management/members/members-table";
import { requireManagementPagePermission } from "@/lib/auth/session";
import { hasManagementPermission } from "@/lib/auth/management-rbac";
import { memberFiltersSchema } from "@/schemas/management/members";
import {
  listCommissions,
  listMembers,
  MEMBERS_PAGE_SIZE,
} from "@/services/management/members.service";

export const metadata: Metadata = { title: "Membres" };

export default async function MembersPage(props: PageProps<"/management/membres">) {
  const user = await requireManagementPagePermission("members:view");
  const canManage = hasManagementPermission(user.managementRole, "members:manage");

  const sp = await props.searchParams;
  const filters = memberFiltersSchema.parse({
    q: typeof sp.q === "string" ? sp.q : undefined,
    status: typeof sp.status === "string" ? sp.status : undefined,
    commissionId: typeof sp.commissionId === "string" ? sp.commissionId : undefined,
    page: typeof sp.page === "string" ? sp.page : 1,
  });

  const [commissions, { rows, total, pageCount }] = await Promise.all([
    listCommissions(),
    listMembers(filters),
  ]);

  const hrefFor = (page: number) => {
    const params = new URLSearchParams();
    if (filters.q) params.set("q", filters.q);
    if (filters.status) params.set("status", filters.status);
    if (filters.commissionId) params.set("commissionId", filters.commissionId);
    if (page > 1) params.set("page", String(page));
    const qs = params.toString();
    return qs ? `/management/membres?${qs}` : "/management/membres";
  };

  const filtered = Boolean(filters.q || filters.status || filters.commissionId);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Membres"
        description="Les personnes du FJCS : bureau, commissions et adhérents actifs."
        actions={
          canManage ? (
            <MemberFormDialog commissions={commissions}>
              <Button>
                <Plus />
                Ajouter un membre
              </Button>
            </MemberFormDialog>
          ) : null
        }
      />

      <MemberFilters commissions={commissions} />

      {rows.length === 0 ? (
        <EmptyState
          icon={Users}
          title={filtered ? "Aucun membre ne correspond" : "Aucun membre enregistré"}
          description={
            filtered
              ? "Modifiez ou réinitialisez les filtres pour élargir la recherche."
              : "Ajoutez les membres du bureau et des commissions : ils pourront ensuite être convoqués aux réunions et pointés en présence."
          }
          action={
            canManage && !filtered ? (
              <MemberFormDialog commissions={commissions}>
                <Button>
                  <Plus />
                  Ajouter le premier membre
                </Button>
              </MemberFormDialog>
            ) : null
          }
        />
      ) : (
        <div className="space-y-3">
          <MembersTable members={rows} commissions={commissions} canManage={canManage} />
          {pageCount > 1 ? (
            <div className="border-border rounded-2xl border bg-white">
              <Pagination
                page={filters.page}
                pageCount={pageCount}
                total={total}
                perPage={MEMBERS_PAGE_SIZE}
                hrefFor={hrefFor}
              />
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
