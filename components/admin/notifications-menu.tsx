"use client";

import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  href: string;
  time: string;
}

export function NotificationsMenu({
  items,
  children,
}: {
  items: NotificationItem[];
  children: React.ReactNode;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Activité récente</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {items.length === 0 ? (
          <p className="text-muted-foreground px-2 py-6 text-center text-sm">
            Aucune activité récente.
          </p>
        ) : (
          items.map((n) => (
            <DropdownMenuItem key={n.id} asChild className="flex-col items-start gap-0.5 py-2">
              <Link href={n.href}>
                <span className="text-sm font-medium">{n.title}</span>
                <span className="text-muted-foreground text-xs">{n.description}</span>
                <span className="text-muted-foreground/70 text-[11px]">{n.time}</span>
              </Link>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
