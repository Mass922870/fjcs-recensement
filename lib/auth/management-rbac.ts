import type { ManagementRole } from "@/lib/generated/prisma/enums";

/**
 * Permissions de l'espace FJCS Management.
 *
 * Volontairement séparé de `lib/auth/rbac.ts` : le rôle sur le recensement et
 * le rôle au bureau sont deux axes indépendants portés par le même compte. Un
 * secrétaire du bureau peut n'être que lecteur sur le recensement, et
 * inversement. Les fusionner obligerait à inventer des rôles composites.
 *
 * Un compte sans `managementRole` n'entre pas du tout dans cet espace.
 */
export const MANAGEMENT_PERMISSIONS = {
  "management:access": [
    "SUPER_ADMIN",
    "PRESIDENT",
    "SECRETAIRE",
    "RESPONSABLE_COMMISSION",
    "MEMBRE_BUREAU",
    "VIEWER",
  ],
  "management:dashboard": [
    "SUPER_ADMIN",
    "PRESIDENT",
    "SECRETAIRE",
    "RESPONSABLE_COMMISSION",
    "MEMBRE_BUREAU",
    "VIEWER",
  ],
  "management:stats": [
    "SUPER_ADMIN",
    "PRESIDENT",
    "SECRETAIRE",
    "RESPONSABLE_COMMISSION",
    "MEMBRE_BUREAU",
  ],
  "management:settings": ["SUPER_ADMIN", "PRESIDENT"],

  "members:view": [
    "SUPER_ADMIN",
    "PRESIDENT",
    "SECRETAIRE",
    "RESPONSABLE_COMMISSION",
    "MEMBRE_BUREAU",
    "VIEWER",
  ],
  "members:manage": ["SUPER_ADMIN", "PRESIDENT", "SECRETAIRE"],
  "commissions:manage": ["SUPER_ADMIN", "PRESIDENT"],

  "meetings:view": [
    "SUPER_ADMIN",
    "PRESIDENT",
    "SECRETAIRE",
    "RESPONSABLE_COMMISSION",
    "MEMBRE_BUREAU",
    "VIEWER",
  ],
  "meetings:create": ["SUPER_ADMIN", "PRESIDENT", "SECRETAIRE", "RESPONSABLE_COMMISSION"],
  "meetings:edit": ["SUPER_ADMIN", "PRESIDENT", "SECRETAIRE", "RESPONSABLE_COMMISSION"],
  "meetings:delete": ["SUPER_ADMIN", "PRESIDENT"],

  "attendance:view": [
    "SUPER_ADMIN",
    "PRESIDENT",
    "SECRETAIRE",
    "RESPONSABLE_COMMISSION",
    "MEMBRE_BUREAU",
    "VIEWER",
  ],
  "attendance:manage": ["SUPER_ADMIN", "PRESIDENT", "SECRETAIRE", "RESPONSABLE_COMMISSION"],
  "attendance:export": ["SUPER_ADMIN", "PRESIDENT", "SECRETAIRE"],

  "minutes:view": [
    "SUPER_ADMIN",
    "PRESIDENT",
    "SECRETAIRE",
    "RESPONSABLE_COMMISSION",
    "MEMBRE_BUREAU",
    "VIEWER",
  ],
  "minutes:create": ["SUPER_ADMIN", "PRESIDENT", "SECRETAIRE"],
  "minutes:edit": ["SUPER_ADMIN", "PRESIDENT", "SECRETAIRE"],
  // La validation clôt le procès-verbal : elle reste à la présidence.
  "minutes:validate": ["SUPER_ADMIN", "PRESIDENT"],
  "minutes:export": ["SUPER_ADMIN", "PRESIDENT", "SECRETAIRE", "RESPONSABLE_COMMISSION"],

  "actions:view": [
    "SUPER_ADMIN",
    "PRESIDENT",
    "SECRETAIRE",
    "RESPONSABLE_COMMISSION",
    "MEMBRE_BUREAU",
    "VIEWER",
  ],
  "actions:create": ["SUPER_ADMIN", "PRESIDENT", "SECRETAIRE", "RESPONSABLE_COMMISSION"],
  "actions:edit": ["SUPER_ADMIN", "PRESIDENT", "SECRETAIRE", "RESPONSABLE_COMMISSION"],
  "actions:assign": ["SUPER_ADMIN", "PRESIDENT", "SECRETAIRE", "RESPONSABLE_COMMISSION"],
  "actions:close": ["SUPER_ADMIN", "PRESIDENT", "SECRETAIRE", "RESPONSABLE_COMMISSION"],

  "documents:view": [
    "SUPER_ADMIN",
    "PRESIDENT",
    "SECRETAIRE",
    "RESPONSABLE_COMMISSION",
    "MEMBRE_BUREAU",
    "VIEWER",
  ],
  "documents:upload": ["SUPER_ADMIN", "PRESIDENT", "SECRETAIRE", "RESPONSABLE_COMMISSION"],
  "documents:delete": ["SUPER_ADMIN", "PRESIDENT"],

  "archives:view": [
    "SUPER_ADMIN",
    "PRESIDENT",
    "SECRETAIRE",
    "RESPONSABLE_COMMISSION",
    "MEMBRE_BUREAU",
    "VIEWER",
  ],
  "management:audit": ["SUPER_ADMIN", "PRESIDENT"],
} as const satisfies Record<string, readonly ManagementRole[]>;

export type ManagementPermission = keyof typeof MANAGEMENT_PERMISSIONS;

export function hasManagementPermission(
  role: ManagementRole | undefined | null,
  permission: ManagementPermission,
): boolean {
  if (!role) return false;
  return (MANAGEMENT_PERMISSIONS[permission] as readonly ManagementRole[]).includes(role);
}

export function managementPermissionsForRole(role: ManagementRole): ManagementPermission[] {
  return (Object.keys(MANAGEMENT_PERMISSIONS) as ManagementPermission[]).filter((p) =>
    hasManagementPermission(role, p),
  );
}

export const MANAGEMENT_ROLE_LABELS: Record<ManagementRole, string> = {
  SUPER_ADMIN: "Super administrateur",
  PRESIDENT: "Présidence",
  SECRETAIRE: "Secrétariat",
  RESPONSABLE_COMMISSION: "Responsable de commission",
  MEMBRE_BUREAU: "Membre du bureau",
  VIEWER: "Lecteur",
};

export const MANAGEMENT_ROLE_DESCRIPTIONS: Record<ManagementRole, string> = {
  SUPER_ADMIN: "Accès complet à l'espace interne.",
  PRESIDENT: "Accès complet, valide les procès-verbaux et gère les commissions.",
  SECRETAIRE: "Réunions, présences, procès-verbaux et actions.",
  RESPONSABLE_COMMISSION: "Réunions et actions de sa commission.",
  MEMBRE_BUREAU: "Consultation, y compris les statistiques internes.",
  VIEWER: "Consultation seule.",
};
