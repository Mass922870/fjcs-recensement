import { prisma } from "@/lib/db";
import { isDemoDataVisible } from "@/lib/demo-data";
import { NotFoundError, ValidationError } from "@/lib/errors";
import { audit } from "@/services/audit.service";
import type { CommissionInput, MemberFilters, MemberInput } from "@/schemas/management/members";
import type { Prisma } from "@/lib/generated/prisma/client";

export const MEMBERS_PAGE_SIZE = 20;

export async function listCommissions(onlyActive = false) {
  return prisma.commission.findMany({
    where: onlyActive ? { isActive: true } : undefined,
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      acronym: true,
      description: true,
      isActive: true,
      sortOrder: true,
      _count: { select: { members: true, meetings: true } },
    },
  });
}

export async function listMembers(filters: MemberFilters) {
  const where: Prisma.MemberWhereInput = {
    ...(isDemoDataVisible() ? {} : { isDemo: false }),
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.commissionId ? { commissionId: filters.commissionId } : {}),
    ...(filters.q
      ? {
          OR: [
            { firstName: { contains: filters.q, mode: "insensitive" } },
            { lastName: { contains: filters.q, mode: "insensitive" } },
            { email: { contains: filters.q, mode: "insensitive" } },
            { phone: { contains: filters.q } },
          ],
        }
      : {}),
  };

  const [total, rows] = await Promise.all([
    prisma.member.count({ where }),
    prisma.member.findMany({
      where,
      orderBy: [{ status: "asc" }, { lastName: "asc" }, { firstName: "asc" }],
      skip: (filters.page - 1) * MEMBERS_PAGE_SIZE,
      take: MEMBERS_PAGE_SIZE,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        email: true,
        role: true,
        status: true,
        joinedAt: true,
        isDemo: true,
        commission: { select: { id: true, name: true } },
        user: { select: { id: true, email: true, managementRole: true } },
      },
    }),
  ]);

  return { rows, total, pageCount: Math.max(1, Math.ceil(total / MEMBERS_PAGE_SIZE)) };
}

export type MemberRow = Awaited<ReturnType<typeof listMembers>>["rows"][number];
export type CommissionRow = Awaited<ReturnType<typeof listCommissions>>[number];

/** Vérifie l'unicité de l'adresse, qui sert aussi de clé de rapprochement. */
async function assertEmailFree(email: string | undefined, exceptId?: string) {
  if (!email) return;
  const existing = await prisma.member.findUnique({ where: { email }, select: { id: true } });
  if (existing && existing.id !== exceptId) {
    throw new ValidationError("Un membre utilise déjà cette adresse.", {
      email: ["Adresse déjà utilisée."],
    });
  }
}

export async function createMember(input: MemberInput, actorId: string) {
  await assertEmailFree(input.email);
  const member = await prisma.member.create({
    data: {
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone,
      email: input.email,
      role: input.role,
      commissionId: input.commissionId,
      status: input.status,
      joinedAt: input.joinedAt,
      notes: input.notes,
    },
    select: { id: true },
  });
  await audit({
    action: "MEMBER_CREATED",
    entityType: "Member",
    entityId: member.id,
    actorId,
    metadata: { status: input.status },
  });
  return member;
}

export async function updateMember(id: string, input: MemberInput, actorId: string) {
  const existing = await prisma.member.findUnique({ where: { id }, select: { id: true } });
  if (!existing) throw new NotFoundError("Membre introuvable.");
  await assertEmailFree(input.email, id);

  await prisma.member.update({
    where: { id },
    data: {
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone,
      email: input.email,
      role: input.role,
      commissionId: input.commissionId ?? null,
      status: input.status,
      joinedAt: input.joinedAt ?? null,
      notes: input.notes,
    },
  });
  await audit({
    action: "MEMBER_UPDATED",
    entityType: "Member",
    entityId: id,
    actorId,
    metadata: { status: input.status },
  });
}

/**
 * Un membre n'est jamais supprimé : il porte l'historique des présences et des
 * actions. Il passe au statut ARCHIVE, qui le retire des listes de convocation.
 */
export async function archiveMember(id: string, actorId: string) {
  const existing = await prisma.member.findUnique({ where: { id }, select: { id: true } });
  if (!existing) throw new NotFoundError("Membre introuvable.");
  await prisma.member.update({ where: { id }, data: { status: "ARCHIVE" } });
  await audit({ action: "MEMBER_ARCHIVED", entityType: "Member", entityId: id, actorId });
}

export async function createCommission(input: CommissionInput, actorId: string) {
  const exists = await prisma.commission.findUnique({
    where: { name: input.name },
    select: { id: true },
  });
  if (exists) {
    throw new ValidationError("Cette commission existe déjà.", { name: ["Nom déjà utilisé."] });
  }
  const last = await prisma.commission.findFirst({
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });
  const commission = await prisma.commission.create({
    data: { ...input, sortOrder: (last?.sortOrder ?? 0) + 1 },
    select: { id: true },
  });
  await audit({
    action: "COMMISSION_CREATED",
    entityType: "Commission",
    entityId: commission.id,
    actorId,
  });
  return commission;
}

export async function updateCommission(id: string, input: CommissionInput, actorId: string) {
  const existing = await prisma.commission.findUnique({ where: { id }, select: { id: true } });
  if (!existing) throw new NotFoundError("Commission introuvable.");
  const duplicate = await prisma.commission.findUnique({
    where: { name: input.name },
    select: { id: true },
  });
  if (duplicate && duplicate.id !== id) {
    throw new ValidationError("Cette commission existe déjà.", { name: ["Nom déjà utilisé."] });
  }
  await prisma.commission.update({ where: { id }, data: input });
  await audit({ action: "COMMISSION_UPDATED", entityType: "Commission", entityId: id, actorId });
}

/** Refusé tant que des membres ou des réunions y sont rattachés. */
export async function deleteCommission(id: string, actorId: string) {
  const commission = await prisma.commission.findUnique({
    where: { id },
    select: { id: true, _count: { select: { members: true, meetings: true } } },
  });
  if (!commission) throw new NotFoundError("Commission introuvable.");
  if (commission._count.members > 0 || commission._count.meetings > 0) {
    throw new ValidationError(
      "Cette commission est utilisée : désactivez-la plutôt que de la supprimer.",
    );
  }
  await prisma.commission.delete({ where: { id } });
  await audit({ action: "COMMISSION_DELETED", entityType: "Commission", entityId: id, actorId });
}
