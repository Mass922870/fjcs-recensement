import { prisma } from "@/lib/db";
import type { EmploymentKind } from "@/lib/generated/prisma/enums";

export interface QuartierOption {
  id: string;
  slug: string;
  name: string;
}
export interface SimpleOption {
  id: string;
  slug: string;
  label: string;
}
export interface SkillOption extends SimpleOption {
  categorySlug: string;
}
export interface NeedOption extends SimpleOption {
  question: string;
}
export interface EmploymentStatusOption extends SimpleOption {
  kind: EmploymentKind;
  requiresDetail: boolean;
}

/** Tous les référentiels actifs, triés - alimentent le formulaire public, l'édition admin et les filtres. */
export interface FormReferentials {
  quartiers: QuartierOption[];
  skillCategories: SimpleOption[];
  skills: SkillOption[];
  interests: SimpleOption[];
  needs: NeedOption[];
  educationLevels: SimpleOption[];
  employmentStatuses: EmploymentStatusOption[];
  sectors: SimpleOption[];
}

const simple = { id: true, slug: true, label: true } as const;

export async function getFormReferentials(): Promise<FormReferentials> {
  const [quartiers, skillCategories, skills, interests, needs, educationLevels, employmentStatuses, sectors] =
    await Promise.all([
      prisma.quartier.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
        select: { id: true, slug: true, name: true },
      }),
      prisma.skillCategory.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" }, select: simple }),
      prisma.skill.findMany({
        where: { isActive: true, category: { isActive: true } },
        orderBy: { sortOrder: "asc" },
        select: { ...simple, category: { select: { slug: true } } },
      }),
      prisma.interest.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" }, select: simple }),
      prisma.need.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
        select: { ...simple, question: true },
      }),
      prisma.educationLevel.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" }, select: simple }),
      prisma.employmentStatus.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
        select: { ...simple, kind: true, requiresDetail: true },
      }),
      prisma.sector.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" }, select: simple }),
    ]);
  return {
    quartiers,
    skillCategories,
    skills: skills.map((s) => ({ id: s.id, slug: s.slug, label: s.label, categorySlug: s.category.slug })),
    interests,
    needs,
    educationLevels,
    employmentStatuses,
    sectors,
  };
}

/** Référentiels complets (actifs ou non) pour les libellés des données historiques et les filtres. */
export async function getAllReferentials(): Promise<FormReferentials> {
  const [quartiers, skillCategories, skills, interests, needs, educationLevels, employmentStatuses, sectors] =
    await Promise.all([
      prisma.quartier.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, slug: true, name: true } }),
      prisma.skillCategory.findMany({ orderBy: { sortOrder: "asc" }, select: simple }),
      prisma.skill.findMany({ orderBy: { sortOrder: "asc" }, select: { ...simple, category: { select: { slug: true } } } }),
      prisma.interest.findMany({ orderBy: { sortOrder: "asc" }, select: simple }),
      prisma.need.findMany({ orderBy: { sortOrder: "asc" }, select: { ...simple, question: true } }),
      prisma.educationLevel.findMany({ orderBy: { sortOrder: "asc" }, select: simple }),
      prisma.employmentStatus.findMany({ orderBy: { sortOrder: "asc" }, select: { ...simple, kind: true, requiresDetail: true } }),
      prisma.sector.findMany({ orderBy: { sortOrder: "asc" }, select: simple }),
    ]);
  return {
    quartiers,
    skillCategories,
    skills: skills.map((s) => ({ id: s.id, slug: s.slug, label: s.label, categorySlug: s.category.slug })),
    interests,
    needs,
    educationLevels,
    employmentStatuses,
    sectors,
  };
}
