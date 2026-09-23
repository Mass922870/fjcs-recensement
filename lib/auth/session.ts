import { cache } from "react";
import { redirect } from "next/navigation";
import type { ManagementRole, Role } from "@/lib/generated/prisma/enums";
import { prisma } from "@/lib/db";
import { ForbiddenError, UnauthorizedError } from "@/lib/errors";
import { auth } from "./index";
import { hasPermission, type Permission } from "./rbac";
import { hasManagementPermission, type ManagementPermission } from "./management-rbac";

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

// ---------------------------------------------------------------------------
//  FJCS Management
// ---------------------------------------------------------------------------

export interface ManagementSessionUser extends SessionUser {
  managementRole: ManagementRole;
}

/**
 * Utilisateur autorisé dans l'espace interne, ou null.
 *
 * Le rôle est relu en base à chaque requête au lieu d'être porté par le jeton :
 * un rôle retiré ou un compte désactivé prend effet immédiatement, alors qu'un
 * jeton reste valable jusqu'à huit heures. Le coût est d'une requête, mise en
 * cache pour la durée du rendu.
 */
export const getManagementUser = cache(async (): Promise<ManagementSessionUser | null> => {
  const user = await getCurrentUser();
  if (!user) return null;
  const row = await prisma.user.findUnique({
    where: { id: user.id },
    select: { managementRole: true, isActive: true },
  });
  if (!row?.isActive || !row.managementRole) return null;
  return { ...user, managementRole: row.managementRole };
});

/** Pour les pages de /management : renvoie vers l'espace recensement si l'accès manque. */
export async function requireManagementUser(): Promise<ManagementSessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/connexion?callbackUrl=%2Fmanagement");
  const managementUser = await getManagementUser();
  if (!managementUser) redirect("/admin?forbidden=management");
  return managementUser;
}

/** Pour les pages de /management : vérifie une permission précise. */
export async function requireManagementPagePermission(
  permission: ManagementPermission,
): Promise<ManagementSessionUser> {
  const user = await requireManagementUser();
  if (!hasManagementPermission(user.managementRole, permission)) {
    redirect("/management?forbidden=1");
  }
  return user;
}

/** Pour les server actions et les routes : lève une erreur typée. */
export async function requireManagementPermission(
  permission: ManagementPermission,
): Promise<ManagementSessionUser> {
  const user = await getManagementUser();
  if (!user) throw new UnauthorizedError();
  if (!hasManagementPermission(user.managementRole, permission)) throw new ForbiddenError();
  return user;
}
