import { prisma } from "@/lib/db";
import type { EmploymentKind } from "@/lib/generated/prisma/enums";
import { NotFoundError, ValidationError } from "@/lib/errors";
import type { ReferentialKind } from "@/lib/constants/referential-kinds";
import type { ReferentialItemInput } from "@/schemas/referentials";
import { audit } from "./audit.service";

export interface ReferentialRow {
  id: string;
  slug: string;
  label: string;
  isActive: boolean;
  sortOrder: number;
  /** Nombre de profils qui utilisent cette valeur (bloque la suppression). */
  usage: number;
  isSystem: boolean;
  latitude?: number | null;
  longitude?: number | null;
  categoryId?: string;
  categoryLabel?: string;
  question?: string;
  kind?: EmploymentKind;
  requiresDetail?: boolean;
}

export function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export async function listReferential(kind: ReferentialKind): Promise<ReferentialRow[]> {
  switch (kind) {
    case "quartier":
      return (
        await prisma.quartier.findMany({
          orderBy: { sortOrder: "asc" },
          include: { _count: { select: { profiles: true } } },
        })
      ).map((q) => ({
        id: q.id,
        slug: q.slug,
        label: q.name,
        isActive: q.isActive,
        sortOrder: q.sortOrder,
        usage: q._count.profiles,
        isSystem: q.slug === "autre",
        latitude: q.latitude,
        longitude: q.longitude,
      }));
    case "educationLevel":
      return (
        await prisma.educationLevel.findMany({
          orderBy: { sortOrder: "asc" },
          include: { _count: { select: { educations: true } } },
        })
      ).map((r) => ({
        id: r.id,
        slug: r.slug,
        label: r.label,
        isActive: r.isActive,
        sortOrder: r.sortOrder,
        usage: r._count.educations,
        isSystem: false,
      }));
    case "employmentStatus":
      return (
        await prisma.employmentStatus.findMany({
          orderBy: { sortOrder: "asc" },
          include: { _count: { select: { employments: true } } },
        })
      ).map((r) => ({
        id: r.id,
        slug: r.slug,
        label: r.label,
        isActive: r.isActive,
        sortOrder: r.sortOrder,
        usage: r._count.employments,
        isSystem: false,
        kind: r.kind,
        requiresDetail: r.requiresDetail,
      }));
    case "skillCategory":
      return (
        await prisma.skillCategory.findMany({
          orderBy: { sortOrder: "asc" },
          include: { _count: { select: { skills: true } } },
        })
      ).map((r) => ({
        id: r.id,
        slug: r.slug,
        label: r.label,
        isActive: r.isActive,
        sortOrder: r.sortOrder,
        usage: r._count.skills,
        isSystem: false,
      }));
    case "skill":
      return (
        await prisma.skill.findMany({
          orderBy: [{ category: { sortOrder: "asc" } }, { sortOrder: "asc" }],
          include: {
            category: { select: { id: true, label: true } },
            _count: { select: { youths: true } },
          },
        })
      ).map((r) => ({
        id: r.id,
        slug: r.slug,
        label: r.label,
        isActive: r.isActive,
        sortOrder: r.sortOrder,
        usage: r._count.youths,
        isSystem: false,
        categoryId: r.category.id,
        categoryLabel: r.category.label,
      }));
    case "need":
      return (
        await prisma.need.findMany({
          orderBy: { sortOrder: "asc" },
          include: { _count: { select: { youths: true } } },
        })
      ).map((r) => ({
        id: r.id,
        slug: r.slug,
        label: r.label,
        isActive: r.isActive,
        sortOrder: r.sortOrder,
        usage: r._count.youths,
        isSystem: r.isSystem,
        question: r.question,
      }));
    case "interest":
      return (
        await prisma.interest.findMany({
          orderBy: { sortOrder: "asc" },
          include: { _count: { select: { youths: true } } },
        })
      ).map((r) => ({
        id: r.id,
        slug: r.slug,
        label: r.label,
        isActive: r.isActive,
        sortOrder: r.sortOrder,
        usage: r._count.youths,
        isSystem: false,
      }));
    case "sector":
      return (await prisma.sector.findMany({ orderBy: { sortOrder: "asc" } })).map((r) => ({
        id: r.id,
        slug: r.slug,
        label: r.label,
        isActive: r.isActive,
        sortOrder: r.sortOrder,
        usage: 0,
        isSystem: false,
      }));
  }
}

async function uniqueSlug(kind: ReferentialKind, label: string): Promise<string> {
  const base = slugify(label) || "item";
  const existing = new Set((await listReferential(kind)).map((r) => r.slug));
  if (!existing.has(base)) return base;
  let i = 2;
  while (existing.has(`${base}-${i}`)) i++;
  return `${base}-${i}`;
}

async function nextSortOrder(kind: ReferentialKind): Promise<number> {
  const rows = await listReferential(kind);
  return rows.length ? Math.max(...rows.map((r) => r.sortOrder)) + 1 : 0;
}

export async function saveReferentialItem(
  kind: ReferentialKind,
  id: string | null,
  input: ReferentialItemInput,
  actorId: string,
): Promise<void> {
  const rows = await listReferential(kind);
  const clash = rows.find(
    (r) => r.label.toLowerCase() === input.label.toLowerCase() && r.id !== id,
  );
  if (clash)
    throw new ValidationError("Ce libellé existe déjà.", { label: ["Libellé déjà utilisé."] });
  if (id && !rows.some((r) => r.id === id)) throw new NotFoundError("Élément introuvable.");

  const common = { label: input.label, isActive: input.isActive };
  const create = async () => ({
    slug: await uniqueSlug(kind, input.label),
    sortOrder: await nextSortOrder(kind),
  });

  switch (kind) {
    case "quartier": {
      const data = {
        name: input.label,
        isActive: input.isActive,
        latitude: input.latitude ?? null,
        longitude: input.longitude ?? null,
      };
      if (id) await prisma.quartier.update({ where: { id }, data });
      else await prisma.quartier.create({ data: { ...data, ...(await create()) } });
      break;
    }
    case "educationLevel":
      if (id) await prisma.educationLevel.update({ where: { id }, data: common });
      else await prisma.educationLevel.create({ data: { ...common, ...(await create()) } });
      break;
    case "employmentStatus": {
      const data = {
        ...common,
        kind: input.kind ?? "OTHER",
        requiresDetail: input.requiresDetail ?? false,
      };
      if (id) await prisma.employmentStatus.update({ where: { id }, data });
      else await prisma.employmentStatus.create({ data: { ...data, ...(await create()) } });
      break;
    }
    case "skillCategory":
      if (id) await prisma.skillCategory.update({ where: { id }, data: common });
      else await prisma.skillCategory.create({ data: { ...common, ...(await create()) } });
      break;
    case "skill": {
      if (!input.categoryId)
        throw new ValidationError("Choisissez une catégorie.", {
          categoryId: ["Catégorie requise."],
        });
      const category = await prisma.skillCategory.findUnique({
        where: { id: input.categoryId },
        select: { id: true },
      });
      if (!category)
        throw new ValidationError("Catégorie inconnue.", { categoryId: ["Catégorie inconnue."] });
      const data = { ...common, categoryId: category.id };
      if (id) await prisma.skill.update({ where: { id }, data });
      else await prisma.skill.create({ data: { ...data, ...(await create()) } });
      break;
    }
    case "need": {
      const data = { ...common, question: input.question || input.label };
      if (id) await prisma.need.update({ where: { id }, data });
      else await prisma.need.create({ data: { ...data, ...(await create()) } });
      break;
    }
    case "interest":
      if (id) await prisma.interest.update({ where: { id }, data: common });
      else await prisma.interest.create({ data: { ...common, ...(await create()) } });
      break;
    case "sector":
      if (id) await prisma.sector.update({ where: { id }, data: common });
      else await prisma.sector.create({ data: { ...common, ...(await create()) } });
      break;
  }

  await audit({
    action: "REFERENTIAL_UPDATED",
    entityType: kind,
    entityId: id ?? undefined,
    actorId,
    metadata: { op: id ? "update" : "create", label: input.label },
  });
}

export async function deleteReferentialItem(
  kind: ReferentialKind,
  id: string,
  actorId: string,
): Promise<void> {
  const row = (await listReferential(kind)).find((r) => r.id === id);
  if (!row) throw new NotFoundError("Élément introuvable.");
  if (row.isSystem)
    throw new ValidationError(
      "Cet élément est utilisé par les indicateurs : vous pouvez le renommer ou le désactiver, pas le supprimer.",
    );
  if (row.usage > 0) {
    throw new ValidationError(
      `Impossible de supprimer : ${row.usage} ${kind === "skillCategory" ? "compétence(s)" : "profil(s)"} utilise(nt) cette valeur. Désactivez-la pour la retirer du formulaire.`,
    );
  }
  switch (kind) {
    case "quartier":
      await prisma.quartier.delete({ where: { id } });
      break;
    case "educationLevel":
      await prisma.educationLevel.delete({ where: { id } });
      break;
    case "employmentStatus":
      await prisma.employmentStatus.delete({ where: { id } });
      break;
    case "skillCategory":
      await prisma.skillCategory.delete({ where: { id } });
      break;
    case "skill":
      await prisma.skill.delete({ where: { id } });
      break;
    case "need":
      await prisma.need.delete({ where: { id } });
      break;
    case "interest":
      await prisma.interest.delete({ where: { id } });
      break;
    case "sector":
      await prisma.sector.delete({ where: { id } });
      break;
  }
  await audit({
    action: "REFERENTIAL_UPDATED",
    entityType: kind,
    entityId: id,
    actorId,
    metadata: { op: "delete", label: row.label },
  });
}

/** Déplace un élément d'un cran vers le haut ou le bas dans l'ordre d'affichage. */
export async function moveReferentialItem(
  kind: ReferentialKind,
  id: string,
  direction: "up" | "down",
  actorId: string,
): Promise<void> {
  const rows = await listReferential(kind);
  const idx = rows.findIndex((r) => r.id === id);
  if (idx === -1) throw new NotFoundError("Élément introuvable.");
  const swapWith = direction === "up" ? idx - 1 : idx + 1;
  if (swapWith < 0 || swapWith >= rows.length) return;
  // Réécrit des sortOrder contigus pour fiabiliser les échanges.
  const order = rows.map((r) => r.id);
  [order[idx], order[swapWith]] = [order[swapWith]!, order[idx]!];
  await prisma.$transaction(order.map((rowId, i) => updateSortOrder(kind, rowId, i)));
  await audit({
    action: "REFERENTIAL_UPDATED",
    entityType: kind,
    entityId: id,
    actorId,
    metadata: { op: "reorder" },
  });
}

function updateSortOrder(kind: ReferentialKind, id: string, sortOrder: number) {
  const data = { sortOrder };
  switch (kind) {
    case "quartier":
      return prisma.quartier.update({ where: { id }, data });
    case "educationLevel":
      return prisma.educationLevel.update({ where: { id }, data });
    case "employmentStatus":
      return prisma.employmentStatus.update({ where: { id }, data });
    case "skillCategory":
      return prisma.skillCategory.update({ where: { id }, data });
    case "skill":
      return prisma.skill.update({ where: { id }, data });
    case "need":
      return prisma.need.update({ where: { id }, data });
    case "interest":
      return prisma.interest.update({ where: { id }, data });
    case "sector":
      return prisma.sector.update({ where: { id }, data });
  }
}
