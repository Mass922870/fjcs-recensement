import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/page-header";
import { CommissionManager } from "@/components/management/commissions/commission-manager";
import { requireManagementPagePermission } from "@/lib/auth/session";
import { hasManagementPermission } from "@/lib/auth/management-rbac";
import { listCommissions } from "@/services/management/members.service";

export const metadata: Metadata = { title: "Paramètres" };

export default async function ManagementSettingsPage() {
  const user = await requireManagementPagePermission("management:settings");
  const canManage = hasManagementPermission(user.managementRole, "commissions:manage");
  const commissions = await listCommissions();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Paramètres"
        description="Configuration de l'espace interne du FJCS."
      />

      <section className="space-y-3">
        <div>
          <h2 className="text-foreground text-base font-semibold">Commissions</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Les commissions servent à rattacher les membres, les réunions et les actions. Une
            commission désactivée reste dans l&apos;historique mais n&apos;est plus proposée à la
            saisie.
          </p>
        </div>
        <CommissionManager commissions={commissions} canManage={canManage} />
      </section>

      <section className="border-border rounded-2xl border border-dashed bg-white/60 p-5">
        <h2 className="text-foreground text-base font-semibold">Accès à l&apos;espace interne</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Le droit d&apos;entrer dans FJCS Management se donne compte par compte, dans Espace
          Jeunesse › Utilisateurs. Un compte sans rôle interne ne voit pas cet espace, même
          s&apos;il administre le recensement.
        </p>
      </section>
    </div>
  );
}
