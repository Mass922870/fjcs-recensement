import { describe, expect, it } from "vitest";
import { PERMISSIONS, hasPermission, permissionsForRole } from "@/lib/auth/rbac";

describe("RBAC", () => {
  it("SUPER_ADMIN possède toutes les permissions", () => {
    for (const p of Object.keys(PERMISSIONS) as (keyof typeof PERMISSIONS)[]) {
      expect(hasPermission("SUPER_ADMIN", p)).toBe(true);
    }
  });

  it("VIEWER ne peut que lire", () => {
    expect(hasPermission("VIEWER", "dashboard:view")).toBe(true);
    expect(hasPermission("VIEWER", "youth:read")).toBe(true);
    expect(hasPermission("VIEWER", "youth:read-personal")).toBe(false);
    expect(hasPermission("VIEWER", "youth:write")).toBe(false);
    expect(hasPermission("VIEWER", "export:aggregated")).toBe(false);
    expect(hasPermission("VIEWER", "users:manage")).toBe(false);
  });

  it("ANALYST accède aux statistiques, rapports et exports anonymisés seulement", () => {
    expect(hasPermission("ANALYST", "stats:view")).toBe(true);
    expect(hasPermission("ANALYST", "reports:generate")).toBe(true);
    expect(hasPermission("ANALYST", "export:aggregated")).toBe(true);
    expect(hasPermission("ANALYST", "export:personal")).toBe(false);
    expect(hasPermission("ANALYST", "youth:write")).toBe(false);
  });

  it("ADMIN gère les données mais pas les utilisateurs ni la suppression définitive", () => {
    expect(hasPermission("ADMIN", "youth:write")).toBe(true);
    expect(hasPermission("ADMIN", "youth:anonymize")).toBe(true);
    expect(hasPermission("ADMIN", "export:personal")).toBe(true);
    expect(hasPermission("ADMIN", "youth:delete")).toBe(false);
    expect(hasPermission("ADMIN", "users:manage")).toBe(false);
  });

  it("refuse sans rôle", () => {
    expect(hasPermission(undefined, "dashboard:view")).toBe(false);
    expect(hasPermission(null, "youth:read")).toBe(false);
  });

  it("permissionsForRole est cohérent avec hasPermission", () => {
    const perms = permissionsForRole("VIEWER");
    expect(perms).toContain("youth:read");
    expect(perms).not.toContain("youth:write");
  });
});
