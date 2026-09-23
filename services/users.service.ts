import { prisma } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { NotFoundError, ValidationError } from "@/lib/errors";
import type { CreateUserInput, UpdateUserInput } from "@/schemas/users";
import { audit } from "./audit.service";

export async function listUsers() {
  return prisma.user.findMany({
    orderBy: [{ isActive: "desc" }, { createdAt: "asc" }],
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      managementRole: true,
      isActive: true,
      lastLoginAt: true,
      createdAt: true,
      lockedUntil: true,
      // Ce qu'une suppression laisserait sans auteur, affiché dans la
      // confirmation : compté ici pour éviter une requête par ligne.
      _count: { select: { auditLogs: true, createdProfiles: true } },
      member: { select: { firstName: true, lastName: true } },
    },
  });
}

export async function createUser(input: CreateUserInput, actorId: string) {
  const exists = await prisma.user.findUnique({
    where: { email: input.email },
    select: { id: true },
  });
  if (exists)
    throw new ValidationError("Un compte existe déjà avec cette adresse e-mail.", {
      email: ["Adresse déjà utilisée."],
    });
  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      role: input.role,
      passwordHash: await hashPassword(input.password),
    },
    select: { id: true },
  });
  await audit({
    action: "USER_CREATED",
    entityType: "User",
    entityId: user.id,
    actorId,
    metadata: { role: input.role },
  });
  return user;
}

export async function updateUser(id: string, input: UpdateUserInput, actorId: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, role: true, isActive: true, managementRole: true },
  });
  if (!user) throw new NotFoundError("Utilisateur introuvable.");

  // Garde-fou : il doit toujours rester au moins un SUPER_ADMIN actif.
  const demoting = user.role === "SUPER_ADMIN" && (input.role !== "SUPER_ADMIN" || !input.isActive);
  if (demoting) {
    const others = await prisma.user.count({
      where: { role: "SUPER_ADMIN", isActive: true, NOT: { id } },
    });
    if (others === 0)
      throw new ValidationError(
        "Impossible : il doit rester au moins un super administrateur actif.",
      );
  }

  const managementRole = input.managementRole ?? null;
  await prisma.user.update({
    where: { id },
    data: { name: input.name, role: input.role, isActive: input.isActive, managementRole },
  });
  await audit({
    action: input.isActive ? "USER_UPDATED" : "USER_DEACTIVATED",
    entityType: "User",
    entityId: id,
    actorId,
    metadata: {
      role: input.role,
      isActive: input.isActive,
      // Tracé explicitement : donner ou retirer l'accès interne est sensible.
      managementRole,
      managementRoleChanged: managementRole !== user.managementRole,
    },
  });
}

export async function resetUserPassword(id: string, password: string, actorId: string) {
  const user = await prisma.user.findUnique({ where: { id }, select: { id: true } });
  if (!user) throw new NotFoundError("Utilisateur introuvable.");
  await prisma.user.update({
    where: { id },
    data: { passwordHash: await hashPassword(password), failedLoginAttempts: 0, lockedUntil: null },
  });
  await audit({
    action: "USER_PASSWORD_CHANGED",
    entityType: "User",
    entityId: id,
    actorId,
    metadata: { by: "admin" },
  });
}

export async function changeOwnPassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { passwordHash: true },
  });
  if (!user) throw new NotFoundError();
  if (!(await verifyPassword(currentPassword, user.passwordHash))) {
    throw new ValidationError("Mot de passe actuel incorrect.", {
      currentPassword: ["Mot de passe actuel incorrect."],
    });
  }
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: await hashPassword(newPassword) },
  });
  await audit({
    action: "USER_PASSWORD_CHANGED",
    entityType: "User",
    entityId: userId,
    actorId: userId,
    metadata: { by: "self" },
  });
}

/**
 * Supprime définitivement un compte.
 *
 * Distincte de la désactivation, qui reste le geste normal : la suppression
 * détache le compte de tout ce qu'il a produit. Les entrées du journal
 * d'audit subsistent mais perdent leur auteur, c'est pourquoi l'adresse et le
 * rôle sont recopiés dans l'entrée de suppression avant l'effacement.
 */
export async function deleteUser(id: string, actorId: string) {
  if (id === actorId) {
    throw new ValidationError("Vous ne pouvez pas supprimer votre propre compte.");
  }

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      managementRole: true,
      isActive: true,
      _count: { select: { auditLogs: true, createdProfiles: true } },
      member: { select: { id: true } },
    },
  });
  if (!user) throw new NotFoundError("Utilisateur introuvable.");

  // Garde-fou identique à celui de la modification : il doit toujours rester
  // un super administrateur actif, sinon plus personne ne gère les comptes.
  if (user.role === "SUPER_ADMIN" && user.isActive) {
    const others = await prisma.user.count({
      where: { role: "SUPER_ADMIN", isActive: true, NOT: { id } },
    });
    if (others === 0) {
      throw new ValidationError(
        "Impossible : il doit rester au moins un super administrateur actif.",
      );
    }
  }

  await audit({
    action: "USER_DELETED",
    entityType: "User",
    entityId: id,
    actorId,
    metadata: {
      email: user.email,
      name: user.name,
      role: user.role,
      managementRole: user.managementRole,
      auditEntries: user._count.auditLogs,
      createdProfiles: user._count.createdProfiles,
      detachedMember: Boolean(user.member),
    },
  });

  await prisma.user.delete({ where: { id } });
}
