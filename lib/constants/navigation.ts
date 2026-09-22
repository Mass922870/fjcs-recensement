export const PUBLIC_NAV = [
  { href: "/", label: "Accueil" },
  { href: "/recensement", label: "Recensement" },
  { href: "/confidentialite", label: "Confidentialité" },
  { href: "/contact", label: "Contact" },
] as const;

import type { Permission } from "@/lib/auth/rbac";

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
