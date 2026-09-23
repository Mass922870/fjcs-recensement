"use client";

import Link from "next/link";
import { Building2, Check, ChevronsUpDown, Users } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Logo } from "@/components/shared/logo";
import {
  CENSUS_SPACE_NAME,
  CENSUS_SPACE_TAGLINE,
  MANAGEMENT_NAME,
  MANAGEMENT_TAGLINE,
} from "@/lib/constants/app";

export type Universe = "census" | "management";

const SPACES = {
  census: { href: "/admin", name: CENSUS_SPACE_NAME, tagline: CENSUS_SPACE_TAGLINE, icon: Users },
  management: {
    href: "/management",
    name: MANAGEMENT_NAME,
    tagline: MANAGEMENT_TAGLINE,
    icon: Building2,
  },
} as const;

interface Props {
  current: Universe;
  /** Faux si le compte n'a aucun rôle dans l'espace interne. */
  canAccessManagement: boolean;
}

/**
 * Bascule entre les deux univers de la plateforme. L'entrée Management
 * n'apparaît que pour les comptes qui y ont réellement droit ; la page cible
 * revérifie de toute façon l'autorisation côté serveur.
 */
export function UniverseSwitcher({ current, canAccessManagement }: Props) {
  const active = SPACES[current];

  if (!canAccessManagement) {
    return (
      <Link
        href={active.href}
        className="flex items-center gap-3 overflow-hidden px-1 py-1"
        aria-label={active.name}
      >
        <Logo variant="emblem" className="size-9 shrink-0 bg-white" />
        <div className="min-w-0 leading-tight group-data-[collapsible=icon]:hidden">
          <p className="truncate text-sm font-semibold text-white">{active.name}</p>
          <p className="text-sidebar-foreground/70 truncate text-xs">{active.tagline}</p>
        </div>
      </Link>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="hover:bg-sidebar-accent/60 focus-visible:ring-sidebar-ring flex w-full items-center gap-3 overflow-hidden rounded-lg px-1 py-1 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none"
        aria-label={`Espace actuel : ${active.name}. Changer d'espace`}
      >
        <Logo variant="emblem" className="size-9 shrink-0 bg-white" />
        <div className="min-w-0 flex-1 leading-tight group-data-[collapsible=icon]:hidden">
          <p className="truncate text-sm font-semibold text-white">{active.name}</p>
          <p className="text-sidebar-foreground/70 truncate text-xs">{active.tagline}</p>
        </div>
        <ChevronsUpDown className="text-sidebar-foreground/60 size-4 shrink-0 group-data-[collapsible=icon]:hidden" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel className="text-muted-foreground text-xs font-normal">
          Espaces de la plateforme
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {(Object.keys(SPACES) as Universe[]).map((key) => {
          const space = SPACES[key];
          const Icon = space.icon;
          return (
            <DropdownMenuItem key={key} asChild>
              <Link href={space.href} className="cursor-pointer gap-3 py-2">
                <Icon className="text-muted-foreground size-4 shrink-0" aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{space.name}</span>
                  <span className="text-muted-foreground block truncate text-xs">
                    {space.tagline}
                  </span>
                </span>
                {key === current ? <Check className="text-primary size-4 shrink-0" /> : null}
              </Link>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
