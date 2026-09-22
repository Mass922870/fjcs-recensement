import { beforeEach, describe, expect, it, vi } from "vitest";
import { ForbiddenError, UnauthorizedError } from "@/lib/errors";

const authMock = vi.fn();
vi.mock("@/lib/auth", () => ({ auth: authMock }));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`REDIRECT:${url}`);
  },
}));

const { requirePermission, requirePagePermission, requireUser } =
  await import("@/lib/auth/session");

describe("protection des routes et actions (côté serveur)", () => {
  beforeEach(() => authMock.mockReset());

  it("requirePermission lève UnauthorizedError sans session", async () => {
    authMock.mockResolvedValue(null);
    await expect(requirePermission("youth:read")).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it("requirePermission lève ForbiddenError si le rôle est insuffisant", async () => {
    authMock.mockResolvedValue({ user: { id: "u1", role: "VIEWER", name: "V", email: "v@x" } });
    await expect(requirePermission("youth:write")).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("requirePermission retourne l'utilisateur autorisé", async () => {
    authMock.mockResolvedValue({ user: { id: "u1", role: "ADMIN", name: "A", email: "a@x" } });
    await expect(requirePermission("youth:write")).resolves.toMatchObject({
      id: "u1",
      role: "ADMIN",
    });
  });

  it("requireUser redirige vers /connexion sans session", async () => {
    authMock.mockResolvedValue(null);
    await expect(requireUser()).rejects.toThrow("REDIRECT:/connexion");
  });

  it("requirePagePermission redirige si permission manquante", async () => {
    authMock.mockResolvedValue({ user: { id: "u1", role: "VIEWER", name: "V", email: "v@x" } });
    await expect(requirePagePermission("users:manage")).rejects.toThrow(
      "REDIRECT:/admin?forbidden=1",
    );
  });
});
