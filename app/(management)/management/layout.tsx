import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { ManagementSidebar } from "@/components/management/management-sidebar";
import { ManagementHeader } from "@/components/management/management-header";
import { requireManagementUser } from "@/lib/auth/session";
import { getManagementAlerts } from "@/services/management/notifications.service";

export const dynamic = "force-dynamic";

export default async function ManagementLayout({ children }: LayoutProps<"/management">) {
  // Barrière réelle : le proxy ne vérifie que la session, le rôle interne se
  // contrôle ici et à nouveau dans chaque page et chaque action.
  const user = await requireManagementUser();
  const alerts = await getManagementAlerts();

  return (
    <SidebarProvider>
      <ManagementSidebar role={user.managementRole} />
      <SidebarInset className="bg-muted/30 min-w-0">
        <ManagementHeader user={user} alerts={alerts} />
        <div className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
