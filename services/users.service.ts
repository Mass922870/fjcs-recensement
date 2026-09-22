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
      isActive: true,
      lastLoginAt: true,
      createdAt: true,
      lockedUntil: true,
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
    select: { id: true, role: true, isActive: true },
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

  await prisma.user.update({
    where: { id },
    data: { name: input.name, role: input.role, isActive: input.isActive },
  });
  await audit({
    action: input.isActive ? "USER_UPDATED" : "USER_DEACTIVATED",
    entityType: "User",
    entityId: id,
    actorId,
    metadata: { role: input.role, isActive: input.isActive },
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
