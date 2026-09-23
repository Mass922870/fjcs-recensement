"use client";

import Link from "next/link";
import { AlertTriangle, Bell, CircleAlert, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ManagementAlert } from "@/services/management/notifications.service";
import { cn } from "@/lib/utils";

const TONES = {
  info: { icon: Info, color: "text-brand-600" },
  warning: { icon: AlertTriangle, color: "text-amber-600" },
  danger: { icon: CircleAlert, color: "text-rose-600" },
};

export function AlertsMenu({ alerts }: { alerts: ManagementAlert[] }) {
  const urgent = alerts.some((a) => a.tone === "danger");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={`Alertes (${alerts.length})`} className="relative">
          <Bell />
          {alerts.length > 0 ? (
            <span
              className={cn(
                "absolute top-1.5 right-1.5 size-2 rounded-full",
                urgent ? "bg-rose-500" : "bg-cyan-500",
              )}
            />
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Alertes du bureau</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {alerts.length === 0 ? (
          <p className="text-muted-foreground px-2 py-6 text-center text-sm">
            Rien ne requiert votre attention.
          </p>
        ) : (
          alerts.map((alert) => {
            const tone = TONES[alert.tone];
            const Icon = tone.icon;
            return (
              <DropdownMenuItem key={alert.id} asChild>
                <Link href={alert.href} className="cursor-pointer items-start gap-2.5 py-2.5">
                  <Icon className={cn("mt-0.5 size-4 shrink-0", tone.color)} aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">{alert.title}</span>
                    <span className="text-muted-foreground block text-xs">{alert.description}</span>
                  </span>
                </Link>
              </DropdownMenuItem>
            );
          })
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
