import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { loginSchema, passwordSchema } from "@/schemas/auth";

describe("mots de passe", () => {
  it("hash et vérifie (bcrypt)", async () => {
    const hash = await hashPassword("Secret1234!");
    expect(hash).not.toContain("Secret1234!");
    expect(await verifyPassword("Secret1234!", hash)).toBe(true);
    expect(await verifyPassword("mauvais", hash)).toBe(false);
  });

  it("impose une politique minimale", () => {
    expect(passwordSchema.safeParse("court1").success).toBe(false);
    expect(passwordSchema.safeParse("sansChiffresIci").success).toBe(false);
    expect(passwordSchema.safeParse("1234567890").success).toBe(false);
    expect(passwordSchema.safeParse("Correct1234").success).toBe(true);
  });

  it("normalise l'e-mail de connexion", () => {
    const r = loginSchema.safeParse({ email: "  Admin@FJCS.sn ", password: "x" });
    expect(r.success && r.data.email).toBe("admin@fjcs.sn");
  });
});
