import { describe, expect, it } from "vitest";
import {
  MANAGEMENT_PERMISSIONS,
  hasManagementPermission,
  managementPermissionsForRole,
  type ManagementPermission,
} from "@/lib/auth/management-rbac";
import { PERMISSIONS } from "@/lib/auth/rbac";

const ALL = Object.keys(MANAGEMENT_PERMISSIONS) as ManagementPermission[];

describe("RBAC de FJCS Management", () => {
  it("SUPER_ADMIN possède toutes les permissions internes", () => {
    for (const p of ALL) expect(hasManagementPermission("SUPER_ADMIN", p)).toBe(true);
  });

  it("un compte sans rôle interne n'a aucun accès", () => {
    for (const p of ALL) {
      expect(hasManagementPermission(null, p)).toBe(false);
      expect(hasManagementPermission(undefined, p)).toBe(false);
    }
  });

  it("seule la présidence valide un procès-verbal", () => {
    expect(hasManagementPermission("PRESIDENT", "minutes:validate")).toBe(true);
    expect(hasManagementPermission("SECRETAIRE", "minutes:validate")).toBe(false);
    expect(hasManagementPermission("RESPONSABLE_COMMISSION", "minutes:validate")).toBe(false);
    expect(hasManagementPermission("MEMBRE_BUREAU", "minutes:validate")).toBe(false);
    expect(hasManagementPermission("VIEWER", "minutes:validate")).toBe(false);
  });

  it("le secrétariat tient les réunions, présences, PV et actions", () => {
    expect(hasManagementPermission("SECRETAIRE", "meetings:create")).toBe(true);
    expect(hasManagementPermission("SECRETAIRE", "attendance:manage")).toBe(true);
    expect(hasManagementPermission("SECRETAIRE", "minutes:create")).toBe(true);
    expect(hasManagementPermission("SECRETAIRE", "actions:assign")).toBe(true);
    // mais ne dispose ni des commissions ni de la suppression
    expect(hasManagementPermission("SECRETAIRE", "commissions:manage")).toBe(false);
    expect(hasManagementPermission("SECRETAIRE", "meetings:delete")).toBe(false);
    expect(hasManagementPermission("SECRETAIRE", "documents:delete")).toBe(false);
  });

  it("le lecteur consulte sans rien modifier", () => {
    const writes: ManagementPermission[] = [
      "meetings:create",
      "meetings:edit",
      "meetings:delete",
      "attendance:manage",
      "minutes:create",
      "minutes:edit",
      "actions:create",
      "documents:upload",
      "members:manage",
      "commissions:manage",
      "management:settings",
    ];
    for (const p of writes) expect(hasManagementPermission("VIEWER", p)).toBe(false);
    expect(hasManagementPermission("VIEWER", "meetings:view")).toBe(true);
    expect(hasManagementPermission("VIEWER", "minutes:view")).toBe(true);
  });

  it("le membre du bureau consulte et voit les statistiques, sans gérer les présences", () => {
    expect(hasManagementPermission("MEMBRE_BUREAU", "management:stats")).toBe(true);
    expect(hasManagementPermission("MEMBRE_BUREAU", "attendance:view")).toBe(true);
    expect(hasManagementPermission("MEMBRE_BUREAU", "attendance:manage")).toBe(false);
  });

  it("chaque rôle reçoit au moins l'accès à l'espace", () => {
    for (const role of ["PRESIDENT", "SECRETAIRE", "RESPONSABLE_COMMISSION", "MEMBRE_BUREAU", "VIEWER"] as const) {
      expect(managementPermissionsForRole(role)).toContain("management:access");
    }
  });

  it("les deux matrices restent cloisonnées : aucune permission commune", () => {
    // Un même nom dans les deux matrices signifierait qu'une vérification
    // pourrait interroger la mauvaise, ce qui ouvrirait un accès croisé.
    const census = new Set(Object.keys(PERMISSIONS));
    const shared = ALL.filter((p) => census.has(p));
    expect(shared).toEqual([]);
  });
});
