export const PUBLIC_NAV = [
  { href: "/", label: "Accueil" },
  { href: "/recensement", label: "Recensement" },
  { href: "/confidentialite", label: "Confidentialité" },
  { href: "/contact", label: "Contact" },
] as const;

import type { Permission } from "@/lib/auth/rbac";
import type { ManagementPermission } from "@/lib/auth/management-rbac";

export interface AdminNavItem {
  href: string;
  label: string;
  icon: string;
  permission: Permission;
}

export const ADMIN_NAV: { group: string; items: AdminNavItem[] }[] = [
  {
    group: "Pilotage",
    items: [
      { href: "/admin", label: "Dashboard", icon: "LayoutDashboard", permission: "dashboard:view" },
      { href: "/admin/jeunes", label: "Jeunes recensés", icon: "Users", permission: "youth:read" },
      {
        href: "/admin/statistiques",
        label: "Statistiques",
        icon: "BarChart3",
        permission: "stats:view",
      },
      { href: "/admin/cartographie", label: "Cartographie", icon: "Map", permission: "map:view" },
    ],
  },
  {
    group: "Production",
    items: [
      {
        href: "/admin/rapports",
        label: "Rapports",
        icon: "FileText",
        permission: "reports:generate",
      },
      {
        href: "/admin/exports",
        label: "Exports",
        icon: "Download",
        permission: "export:aggregated",
      },
    ],
  },
  {
    group: "Administration",
    items: [
      {
        href: "/admin/utilisateurs",
        label: "Utilisateurs",
        icon: "UserCog",
        permission: "users:manage",
      },
      {
        href: "/admin/journal-audit",
        label: "Journal d'activité",
        icon: "ScrollText",
        permission: "audit:view",
      },
      {
        href: "/admin/parametres",
        label: "Paramètres",
        icon: "Settings",
        permission: "settings:manage",
      },
    ],
  },
];

export interface ManagementNavItem {
  href: string;
  label: string;
  icon: string;
  permission: ManagementPermission;
  /** Faux tant que le module n'est pas livré : affiché, mais non cliquable. */
  available?: boolean;
}

/**
 * Navigation de l'espace interne. Les modules encore à venir restent visibles
 * pour donner à voir la cible, mais ne renvoient pas vers une page inexistante.
 */
export const MANAGEMENT_NAV: { group: string; items: ManagementNavItem[] }[] = [
  {
    group: "Pilotage",
    items: [
      {
        href: "/management",
        label: "Dashboard",
        icon: "LayoutDashboard",
        permission: "management:dashboard",
        available: true,
      },
      {
        href: "/management/reunions",
        label: "Réunions",
        icon: "CalendarClock",
        permission: "meetings:view",
        available: true,
      },
      {
        href: "/management/calendrier",
        label: "Calendrier",
        icon: "CalendarDays",
        permission: "meetings:view",
        available: true,
      },
    ],
  },
  {
    group: "Séances",
    items: [
      {
        href: "/management/presences",
        label: "Présences",
        icon: "UserCheck",
        permission: "attendance:view",
        available: true,
      },
      {
        href: "/management/proces-verbaux",
        label: "Procès-verbaux",
        icon: "FileText",
        permission: "minutes:view",
        available: true,
      },
      {
        href: "/management/actions",
        label: "Actions et décisions",
        icon: "ListChecks",
        permission: "actions:view",
        available: true,
      },
    ],
  },
  {
    group: "Ressources",
    items: [
      {
        href: "/management/membres",
        label: "Membres",
        icon: "Users",
        permission: "members:view",
        available: true,
      },
      {
        href: "/management/documents",
        label: "Documents",
        icon: "FolderClosed",
        permission: "documents:view",
        available: true,
      },
      {
        href: "/management/archives",
        label: "Archives",
        icon: "Archive",
        permission: "archives:view",
        available: true,
      },
    ],
  },
  {
    group: "Administration",
    items: [
      {
        href: "/management/statistiques",
        label: "Statistiques",
        icon: "BarChart3",
        permission: "management:stats",
        available: true,
      },
      {
        href: "/management/parametres",
        label: "Paramètres",
        icon: "Settings",
        permission: "management:settings",
        available: true,
      },
    ],
  },
];
