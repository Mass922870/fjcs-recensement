import type { Role } from "@/lib/generated/prisma/enums";

/**
 * Permissions granulaires → rôles. Toute vérification d'accès passe par
 * `hasPermission` (serveur) ; le frontend ne fait qu'adapter l'affichage.
 */
export const PERMISSIONS = {
  "dashboard:view": ["SUPER_ADMIN", "ADMIN", "ANALYST", "VIEWER"],
  "youth:read": ["SUPER_ADMIN", "ADMIN", "ANALYST", "VIEWER"],
  "youth:read-personal": ["SUPER_ADMIN", "ADMIN"],
  "youth:write": ["SUPER_ADMIN", "ADMIN"],
  "youth:archive": ["SUPER_ADMIN", "ADMIN"],
  "youth:anonymize": ["SUPER_ADMIN", "ADMIN"],
  "youth:delete": ["SUPER_ADMIN"],
  "stats:view": ["SUPER_ADMIN", "ADMIN", "ANALYST", "VIEWER"],
  "map:view": ["SUPER_ADMIN", "ADMIN", "ANALYST", "VIEWER"],
  "reports:generate": ["SUPER_ADMIN", "ADMIN", "ANALYST"],
  "export:aggregated": ["SUPER_ADMIN", "ADMIN", "ANALYST"],
  "export:personal": ["SUPER_ADMIN", "ADMIN"],
  "users:manage": ["SUPER_ADMIN"],
  "settings:manage": ["SUPER_ADMIN", "ADMIN"],
  "audit:view": ["SUPER_ADMIN", "ADMIN"],
} as const satisfies Record<string, readonly Role[]>;

export type Permission = keyof typeof PERMISSIONS;

export function hasPermission(role: Role | undefined | null, permission: Permission): boolean {
  if (!role) return false;
  return (PERMISSIONS[permission] as readonly Role[]).includes(role);
}

export function permissionsForRole(role: Role): Permission[] {
  return (Object.keys(PERMISSIONS) as Permission[]).filter((p) => hasPermission(role, p));
}
