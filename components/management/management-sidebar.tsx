"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Archive,
  BarChart3,
  CalendarClock,
  CalendarDays,
  FileText,
  FolderClosed,
  LayoutDashboard,
  ListChecks,
  Settings,
  UserCheck,
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
import { MANAGEMENT_NAV } from "@/lib/constants/navigation";
import { hasManagementPermission } from "@/lib/auth/management-rbac";
import type { ManagementRole } from "@/lib/generated/prisma/enums";

const ICONS: Record<string, LucideIcon> = {
  LayoutDashboard,
  CalendarClock,
  CalendarDays,
  UserCheck,
  FileText,
  ListChecks,
  Users,
  FolderClosed,
  Archive,
  BarChart3,
  Settings,
};

export function ManagementSidebar({ role }: { role: ManagementRole }) {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarHeader className="px-3 py-4">
        <UniverseSwitcher current="management" canAccessManagement />
      </SidebarHeader>

      <SidebarContent>
        {MANAGEMENT_NAV.map((group) => {
          const items = group.items.filter((i) => hasManagementPermission(role, i.permission));
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
                      item.href === "/management"
                        ? pathname === "/management"
                        : pathname.startsWith(item.href);

                    // Module à venir : visible pour donner à voir la cible,
                    // mais jamais cliquable vers une page inexistante.
                    if (!item.available) {
                      return (
                        <SidebarMenuItem key={item.href}>
                          <SidebarMenuButton
                            disabled
                            tooltip={`${item.label} - bientôt disponible`}
                            className="cursor-default opacity-45"
                          >
                            <Icon />
                            <span>{item.label}</span>
                            <span className="text-sidebar-foreground/50 ml-auto text-[10px] tracking-wide uppercase group-data-[collapsible=icon]:hidden">
                              bientôt
                            </span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    }

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
            Espace interne réservé aux membres habilités du FJCS
          </p>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
