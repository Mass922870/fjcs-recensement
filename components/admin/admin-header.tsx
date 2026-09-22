"use client";

import { Bell, LogOut, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { GlobalSearch } from "@/components/admin/global-search";
import { NotificationsMenu, type NotificationItem } from "@/components/admin/notifications-menu";
import { logoutAction } from "@/actions/auth";
import { ROLE_LABELS } from "@/lib/constants/referentials";
import type { SessionUser } from "@/lib/auth/session";

interface AdminHeaderProps {
  user: SessionUser;
  notifications: NotificationItem[];
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
}

export function AdminHeader({ user, notifications }: AdminHeaderProps) {
  return (
    <header className="border-border sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-white/90 px-4 backdrop-blur sm:px-6">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="h-5" />

      <div className="flex flex-1 items-center justify-end gap-2 sm:justify-between">
        <GlobalSearch />

        <div className="flex items-center gap-1.5">
          <NotificationsMenu items={notifications}>
            <Button variant="ghost" size="icon" aria-label="Notifications" className="relative">
              <Bell />
              {notifications.length ? (
                <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-cyan-500" />
              ) : null}
            </Button>
          </NotificationsMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-9 gap-2 px-2" aria-label="Menu du compte">
                <Avatar className="size-7">
                  <AvatarFallback className="bg-brand-100 text-brand-800 text-xs font-semibold">
                    {initials(user.name) || <UserRound className="size-4" />}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden text-sm font-medium md:inline">{user.name}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel className="space-y-1">
                <p className="truncate text-sm font-medium">{user.name}</p>
                <p className="text-muted-foreground truncate text-xs font-normal">{user.email}</p>
                <Badge variant="secondary" className="mt-1">
                  {ROLE_LABELS[user.role]}
                </Badge>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onSelect={() => {
                  void logoutAction();
                }}
              >
                <LogOut />
                Se déconnecter
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
