"use server";

import { AuthError } from "next-auth";
import { signIn, signOut } from "@/lib/auth";
import { loginSchema } from "@/schemas/auth";
import { rateLimit } from "@/lib/security/rate-limit";
import { getHashedClientIp } from "@/lib/security/request";
import { getCurrentUser } from "@/lib/auth/session";
import { audit } from "@/services/audit.service";

export interface LoginState {
  error?: string;
  /** E-mail saisi, renvoyé pour ne pas vider le champ après une erreur. */
  email?: string;
}

/** Seules les URLs internes sont acceptées comme destination post-connexion. */
function safeCallbackUrl(raw: unknown): string {
  if (typeof raw !== "string" || !raw.startsWith("/") || raw.startsWith("//")) return "/admin";
  return raw;
}

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const ipHash = await getHashedClientIp();
  const rl = await rateLimit("auth:login", ipHash, { limit: 10, windowSeconds: 15 * 60 });
  const email = typeof formData.get("email") === "string" ? String(formData.get("email")) : "";
  if (!rl.ok) {
    return { email, error: "Trop de tentatives. Réessayez dans quelques minutes." };
  }

  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { email, error: "Adresse e-mail ou mot de passe invalide." };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: safeCallbackUrl(formData.get("callbackUrl")),
    });
    return {};
  } catch (error) {
    if (error instanceof AuthError) {
      return { email, error: "Identifiants incorrects ou compte verrouillé." };
    }
    // Redirection Next.js (succès) : doit remonter.
    throw error;
  }
}

export async function logoutAction(): Promise<void> {
  const user = await getCurrentUser();
  if (user) {
    await audit({ action: "LOGOUT", entityType: "User", entityId: user.id, actorId: user.id });
  }
  await signOut({ redirectTo: "/connexion" });
}
