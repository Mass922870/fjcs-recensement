"use client";

import Link from "next/link";
import { ArrowLeftRight, LogOut, UserRound } from "lucide-react";
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
import { AlertsMenu } from "@/components/management/alerts-menu";
import { logoutAction } from "@/actions/auth";
import { MANAGEMENT_ROLE_LABELS } from "@/lib/auth/management-rbac";
import { ROLE_LABELS } from "@/lib/constants/referentials";
import { CENSUS_SPACE_NAME, MANAGEMENT_NAME } from "@/lib/constants/app";
import type { ManagementSessionUser } from "@/lib/auth/session";
import type { ManagementAlert } from "@/services/management/notifications.service";

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
}

export function ManagementHeader({
  user,
  alerts,
}: {
  user: ManagementSessionUser;
  alerts: ManagementAlert[];
}) {
  return (
    <header className="border-border sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-white/90 px-4 backdrop-blur sm:px-6">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="h-5" />

      <div className="flex min-w-0 items-center gap-2">
        <span className="bg-cyan-50 text-cyan-700 hidden rounded-md px-2 py-1 text-xs font-semibold sm:inline">
          {MANAGEMENT_NAME}
        </span>
      </div>

      <div className="flex flex-1 items-center justify-end gap-1.5">
        <AlertsMenu alerts={alerts} />

        <Button variant="ghost" size="sm" className="hidden gap-2 sm:inline-flex" asChild>
          <Link href="/admin">
            <ArrowLeftRight className="size-4" />
            {CENSUS_SPACE_NAME}
          </Link>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-9 gap-2 px-2" aria-label="Menu du compte">
              <Avatar className="size-7">
                <AvatarFallback className="bg-cyan-100 text-xs font-semibold text-cyan-800">
                  {initials(user.name) || <UserRound className="size-4" />}
                </AvatarFallback>
              </Avatar>
              <span className="hidden text-sm font-medium md:inline">{user.name}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72">
            <DropdownMenuLabel className="space-y-1">
              <p className="truncate text-sm font-medium">{user.name}</p>
              <p className="text-muted-foreground truncate text-xs font-normal">{user.email}</p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                <Badge className="bg-cyan-100 text-cyan-800 hover:bg-cyan-100">
                  {MANAGEMENT_ROLE_LABELS[user.managementRole]}
                </Badge>
                <Badge variant="secondary">{ROLE_LABELS[user.role]}</Badge>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/admin">
                <ArrowLeftRight />
                Aller à l&apos;{CENSUS_SPACE_NAME.toLowerCase()}
              </Link>
            </DropdownMenuItem>
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
    </header>
  );
}
