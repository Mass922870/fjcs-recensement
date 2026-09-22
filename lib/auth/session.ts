import { cache } from "react";
import { redirect } from "next/navigation";
import type { Role } from "@/lib/generated/prisma/enums";
import { ForbiddenError, UnauthorizedError } from "@/lib/errors";
import { auth } from "./index";
import { hasPermission, type Permission } from "./rbac";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

/** Utilisateur connecté (mis en cache par requête) ou null. */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const session = await auth();
  const u = session?.user;
  if (!u?.id || !u.role) return null;
  return { id: u.id, name: u.name ?? "", email: u.email ?? "", role: u.role };
});

/** Pour les pages : redirige vers la connexion si non authentifié. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/connexion");
  return user;
}

/** Pour les pages : redirige si la permission manque. */
export async function requirePagePermission(permission: Permission): Promise<SessionUser> {
  const user = await requireUser();
  if (!hasPermission(user.role, permission)) redirect("/admin?forbidden=1");
  return user;
}

/** Pour les server actions / routes : lève une erreur typée. */
export async function requirePermission(permission: Permission): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new UnauthorizedError();
  if (!hasPermission(user.role, permission)) throw new ForbiddenError();
  return user;
}
