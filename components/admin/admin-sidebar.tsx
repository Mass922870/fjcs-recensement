"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Download,
  ExternalLink,
  FileText,
  LayoutDashboard,
  Map,
  ScrollText,
  Settings,
  UserCog,
  Users,
  type LucideIcon,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { Logo } from "@/components/shared/logo";
import { UniverseSwitcher } from "@/components/management/universe-switcher";
import { ADMIN_NAV } from "@/lib/constants/navigation";
import { hasPermission } from "@/lib/auth/rbac";
import type { Role } from "@/lib/generated/prisma/enums";

const ICONS: Record<string, LucideIcon> = {
  LayoutDashboard,
  Users,
  BarChart3,
  Map,
  FileText,
  Download,
  UserCog,
  ScrollText,
  Settings,
};

export function AdminSidebar({
  role,
  canAccessManagement,
}: {
  role: Role;
  canAccessManagement: boolean;
}) {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarHeader className="px-3 py-4">
        <UniverseSwitcher current="census" canAccessManagement={canAccessManagement} />
      </SidebarHeader>

      <SidebarContent>
        {ADMIN_NAV.map((group) => {
          const items = group.items.filter((i) => hasPermission(role, i.permission));
          if (!items.length) return null;
          return (
            <SidebarGroup key={group.group}>
              <SidebarGroupLabel className="text-sidebar-foreground/50">
                {group.group}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {items.map((item) => {
                    const Icon = ICONS[item.icon] ?? LayoutDashboard;
                    const active =
                      item.href === "/admin"
                        ? pathname === "/admin"
                        : pathname.startsWith(item.href);
                    return (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton asChild isActive={active} tooltip={item.label}>
                          <Link href={item.href}>
                            <Icon />
                            <span>{item.label}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
      </SidebarContent>

      <SidebarFooter>
        <div className="flex items-center gap-2 px-2 py-1 group-data-[collapsible=icon]:hidden">
          <Logo org="ctni" variant="emblem" className="size-7 shrink-0 bg-white" />
          <p className="text-sidebar-foreground/70 text-[11px] leading-tight">
            Une initiative de la Commission Transformation Numérique et Innovation
          </p>
        </div>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Site public">
              <Link href="/" target="_blank" rel="noreferrer">
                <ExternalLink />
                <span>Voir le site public</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
