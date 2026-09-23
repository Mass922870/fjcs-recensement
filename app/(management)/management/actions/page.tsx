import type { Metadata } from "next";
import { CircleAlert, CircleCheck, CirclePause, ListChecks, Plus, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/admin/page-header";
import { ManagementStatCard } from "@/components/management/management-stat-card";
import { ActionFilters } from "@/components/management/actions/action-filters";
import { ActionsBoard } from "@/components/management/actions/actions-board";
import { ActionFormDialog } from "@/components/management/actions/action-form-dialog";
import { requireManagementPagePermission } from "@/lib/auth/session";
import { hasManagementPermission } from "@/lib/auth/management-rbac";
import { actionFiltersSchema } from "@/schemas/management/actions";
import { getActionStats, listActions } from "@/services/management/actions.service";
import { listSelectableMembers } from "@/services/management/meetings.service";
import { listCommissions } from "@/services/management/members.service";

export const metadata: Metadata = { title: "Actions et décisions" };

export default async function ActionsPage(props: PageProps<"/management/actions">) {
  const user = await requireManagementPagePermission("actions:view");
  const canEdit = hasManagementPermission(user.managementRole, "actions:edit");
  const canCreate = hasManagementPermission(user.managementRole, "actions:create");

  const sp = await props.searchParams;
  const str = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : undefined);
  const filters = actionFiltersSchema.parse({
    q: str("q"),
    status: str("status"),
    priority: str("priority"),
    assigneeId: str("assigneeId"),
    commissionId: str("commissionId"),
    due: str("due"),
    view: str("view") ?? "kanban",
  });

  const [actions, stats, members, commissions] = await Promise.all([
    listActions(filters),
    getActionStats(),
    listSelectableMembers(),
    listCommissions(true),
  ]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Actions et décisions"
        description="Le suivi de ce qui a été décidé en séance, jusqu'à sa réalisation."
        actions={
          canCreate ? (
            <ActionFormDialog members={members} commissions={commissions}>
              <Button>
                <Plus />
                Nouvelle action
              </Button>
            </ActionFormDialog>
          ) : null
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <ManagementStatCard index={0} label="À faire" value={stats.todo} icon={ListChecks} />
        <ManagementStatCard index={1} label="En cours" value={stats.inProgress} icon={Timer} accent="cyan" />
        <ManagementStatCard index={2} label="Bloquées" value={stats.blocked} icon={CirclePause} accent="rose" />
        <ManagementStatCard index={3} label="Terminées" value={stats.done} icon={CircleCheck} accent="green" />
        <ManagementStatCard
          index={4}
          label="En retard"
          value={stats.overdue}
          icon={CircleAlert}
          accent="amber"
          hint={`${stats.dueSoon} à échéance sous 7 jours`}
        />
      </div>

      <ActionFilters members={members} commissions={commissions} />

      <ActionsBoard
        actions={actions}
        members={members}
        commissions={commissions}
        view={filters.view}
        canEdit={canEdit}
      />
    </div>
  );
}
