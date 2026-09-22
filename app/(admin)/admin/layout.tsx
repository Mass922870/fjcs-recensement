import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminHeader } from "@/components/admin/admin-header";
import { requireUser } from "@/lib/auth/session";
import { getRecentNotifications } from "@/services/notifications.service";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const user = await requireUser();
  const notifications = await getRecentNotifications();

  return (
    <SidebarProvider>
      <AdminSidebar role={user.role} />
      <SidebarInset className="bg-muted/30 min-w-0">
        <AdminHeader user={user} notifications={notifications} />
        <div className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
