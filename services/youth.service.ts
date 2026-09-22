import { prisma } from "@/lib/db";
import type { Prisma } from "@/lib/generated/prisma/client";
import type { ProfileSource } from "@/lib/generated/prisma/enums";
import { DuplicatePhoneError, NotFoundError, ValidationError } from "@/lib/errors";
import { normalizePhone } from "@/lib/phone";
import { generateParticipationCode } from "@/lib/participation-code";
import { CONSENT_TEXT_VERSION } from "@/lib/constants/app";
import type { CensusFormOutput } from "@/schemas/youth";
import { audit } from "./audit.service";

export interface CreateProfileContext {
  source: ProfileSource;
  isDemo?: boolean;
  createdById?: string | null;
  ipHash?: string | null;
  userAgent?: string | null;
  /** Date d'inscription forcée (seed de démonstration uniquement). */
  createdAt?: Date;
}

/** Résout les slugs de référentiel en identifiants ; les slugs inconnus/inactifs sont ignorés (listes) ou refusés (niveau, situation). */
async function resolveSlugs(
  tx: Prisma.TransactionClient,
  data: CensusFormOutput,
): Promise<{
  quartierId: string | null;
  levelId: string;
  status: { id: string; kind: string; requiresDetail: boolean };
  skillIds: string[];
  interestIds: string[];
  needIds: string[];
}> {
  const [quartier, level, status, skills, interests, needs] = await Promise.all([
    tx.quartier.findUnique({ where: { slug: data.personal.quartierSlug }, select: { id: true } }),
    tx.educationLevel.findUnique({ where: { slug: data.education.levelSlug }, select: { id: true } }),
    tx.employmentStatus.findUnique({
      where: { slug: data.employment.statusSlug },
      select: { id: true, kind: true, requiresDetail: true },
    }),
    data.skills.skillSlugs.length
      ? tx.skill.findMany({ where: { slug: { in: data.skills.skillSlugs }, isActive: true }, select: { id: true } })
      : [],
    data.interests.interestSlugs.length
      ? tx.interest.findMany({ where: { slug: { in: data.interests.interestSlugs }, isActive: true }, select: { id: true } })
      : [],
    data.needs.needSlugs.length
      ? tx.need.findMany({ where: { slug: { in: data.needs.needSlugs }, isActive: true }, select: { id: true } })
      : [],
  ]);
  if (!level) throw new ValidationError("Niveau d'études inconnu.", { "education.levelSlug": ["Choix invalide."] });
  if (!status) throw new ValidationError("Situation professionnelle inconnue.", { "employment.statusSlug": ["Choix invalide."] });
  return {
    quartierId: quartier?.id ?? null,
    levelId: level.id,
    status,
    skillIds: skills.map((s) => s.id),
    interestIds: interests.map((i) => i.id),
    needIds: needs.map((n) => n.id),
  };
}

export async function findActiveProfileByPhone(phoneNormalized: string) {
  return prisma.youthProfile.findUnique({
    where: { phoneNormalized },
    select: { id: true, status: true, participationCode: true },
  });
}

/**
 * Crée un profil complet (profil + formation + situation + projet + compétences +
 * intérêts + besoins + consentement) dans une transaction.
 * Lève DuplicatePhoneError si le numéro est déjà enregistré.
 */
export async function createYouthProfile(
  data: CensusFormOutput,
  ctx: CreateProfileContext,
): Promise<{ id: string; participationCode: string }> {
  const phoneNormalized = normalizePhone(data.personal.phone);
  if (!phoneNormalized) {
    throw new ValidationError("Numéro de téléphone invalide."); // validé en amont normalement
  }

  const existing = await findActiveProfileByPhone(phoneNormalized);
  if (existing) {
    await audit({
      action: "DUPLICATE_ATTEMPT",
      entityType: "YouthProfile",
      entityId: existing.id,
      ipHash: ctx.ipHash,
      actorId: ctx.createdById,
    });
    throw new DuplicatePhoneError();
  }

  return prisma.$transaction(async (tx) => {
    const refs = await resolveSlugs(tx, data);

    // Le code de participation est unique ; on retente en cas de collision improbable.
    let participationCode = generateParticipationCode();
    for (let i = 0; i < 3; i++) {
      const clash = await tx.youthProfile.findUnique({ where: { participationCode } });
      if (!clash) break;
      participationCode = generateParticipationCode();
    }

    const isEntrepreneur = refs.status.kind === "ENTREPRENEUR" && data.employment.project;

    const profile = await tx.youthProfile.create({
      data: {
        participationCode,
        firstName: data.personal.firstName,
        lastName: data.personal.lastName,
        birthDate: new Date(data.personal.birthDate),
        gender: data.personal.gender,
        phone: data.personal.phone,
        phoneNormalized,
        email: data.personal.email ?? null,
        quartierId: refs.quartierId,
        quartierOther: data.personal.quartierOther ?? null,
        source: ctx.source,
        isDemo: ctx.isDemo ?? false,
        createdById: ctx.createdById ?? null,
        customSkills: data.skills.customSkills ?? null,
        customInterests: data.interests.customInterests ?? null,
        ...(ctx.createdAt ? { createdAt: ctx.createdAt } : {}),
        education: {
          create: {
            levelId: refs.levelId,
            field: data.education.field ?? null,
            institution: data.education.institution ?? null,
            diploma: data.education.diploma ?? null,
            vocationalTraining: data.education.vocationalTraining ?? null,
            otherTraining: data.education.otherTraining ?? null,
          },
        },
        employment: {
          create: {
            statusId: refs.status.id,
            otherDetail: data.employment.otherDetail ?? null,
          },
        },
        project: isEntrepreneur
          ? {
              create: {
                sector: data.employment.project!.sector,
                name: data.employment.project!.name ?? null,
                isFormalized: data.employment.project!.isFormalized,
                sinceMonths: data.employment.project!.sinceMonths ?? null,
                teamSize: data.employment.project!.teamSize ?? null,
              },
            }
          : undefined,
        consent: {
          create: {
            accepted: true,
            textVersion: CONSENT_TEXT_VERSION,
            ipHash: ctx.ipHash ?? null,
            userAgent: ctx.userAgent ?? null,
          },
        },
        skills: { create: refs.skillIds.map((skillId) => ({ skillId })) },
        interests: { create: refs.interestIds.map((interestId) => ({ interestId })) },
        needs: { create: refs.needIds.map((needId) => ({ needId })) },
      },
      select: { id: true, participationCode: true },
    });

    await audit(
      {
        action: "PROFILE_CREATED",
        entityType: "YouthProfile",
        entityId: profile.id,
        actorId: ctx.createdById,
        ipHash: ctx.ipHash,
        metadata: { source: ctx.source, isDemo: ctx.isDemo ?? false },
      },
      tx,
    );

    return profile;
  });
}

export async function getProfileByParticipationCode(code: string) {
  const profile = await prisma.youthProfile.findUnique({
    where: { participationCode: code },
    select: { participationCode: true, firstName: true, createdAt: true },
  });
  if (!profile) throw new NotFoundError();
  return profile;
}

// ---------------------------------------------------------------------------
// Administration : mise à jour, archivage, anonymisation, suppression
// ---------------------------------------------------------------------------

export interface AdminContext {
  actorId: string;
  ipHash?: string | null;
}

/** Met à jour un profil complet (mêmes schémas que le formulaire public). */
export async function updateYouthProfile(
  id: string,
  data: CensusFormOutput,
  ctx: AdminContext,
): Promise<void> {
  const current = await prisma.youthProfile.findUnique({
    where: { id },
    select: { id: true, status: true },
  });
  if (!current) throw new NotFoundError("Profil introuvable.");
  if (current.status === "ANONYMIZED") {
    throw new ValidationError("Un profil anonymisé ne peut plus être modifié.");
  }

  const phoneNormalized = normalizePhone(data.personal.phone);
  if (!phoneNormalized) throw new ValidationError("Numéro de téléphone invalide.");
  const clash = await prisma.youthProfile.findFirst({
    where: { phoneNormalized, NOT: { id } },
    select: { id: true },
  });
  if (clash) throw new DuplicatePhoneError();

  await prisma.$transaction(async (tx) => {
    const refs = await resolveSlugs(tx, data);
    const project = refs.status.kind === "ENTREPRENEUR" ? data.employment.project : undefined;

    await tx.youthProfile.update({
      where: { id },
      data: {
        firstName: data.personal.firstName,
        lastName: data.personal.lastName,
        birthDate: new Date(data.personal.birthDate),
        gender: data.personal.gender,
        phone: data.personal.phone,
        phoneNormalized,
        email: data.personal.email ?? null,
        quartierId: refs.quartierId,
        quartierOther: data.personal.quartierOther ?? null,
        customSkills: data.skills.customSkills ?? null,
        customInterests: data.interests.customInterests ?? null,
        education: {
          upsert: {
            create: {
              levelId: refs.levelId,
              field: data.education.field ?? null,
              institution: data.education.institution ?? null,
              diploma: data.education.diploma ?? null,
              vocationalTraining: data.education.vocationalTraining ?? null,
              otherTraining: data.education.otherTraining ?? null,
            },
            update: {
              levelId: refs.levelId,
              field: data.education.field ?? null,
              institution: data.education.institution ?? null,
              diploma: data.education.diploma ?? null,
              vocationalTraining: data.education.vocationalTraining ?? null,
              otherTraining: data.education.otherTraining ?? null,
            },
          },
        },
        employment: {
          upsert: {
            create: {
              statusId: refs.status.id,
              otherDetail: data.employment.otherDetail ?? null,
            },
            update: {
              statusId: refs.status.id,
              otherDetail: data.employment.otherDetail ?? null,
            },
          },
        },
        skills: { deleteMany: {}, create: refs.skillIds.map((skillId) => ({ skillId })) },
        interests: {
          deleteMany: {},
          create: refs.interestIds.map((interestId) => ({ interestId })),
        },
        needs: { deleteMany: {}, create: refs.needIds.map((needId) => ({ needId })) },
      },
    });

    // Activité entrepreneuriale : présente uniquement si la situation est ENTREPRENEUR.
    if (project) {
      const values = {
        sector: project.sector,
        name: project.name ?? null,
        isFormalized: project.isFormalized,
        sinceMonths: project.sinceMonths ?? null,
        teamSize: project.teamSize ?? null,
      };
      await tx.project.upsert({
        where: { youthId: id },
        create: { youthId: id, ...values },
        update: values,
      });
    } else {
      await tx.project.deleteMany({ where: { youthId: id } });
    }

    await audit(
      {
        action: "PROFILE_UPDATED",
        entityType: "YouthProfile",
        entityId: id,
        actorId: ctx.actorId,
        ipHash: ctx.ipHash,
      },
      tx,
    );
  });
}

export async function setYouthArchived(
  id: string,
  archived: boolean,
  ctx: AdminContext,
): Promise<void> {
  const current = await prisma.youthProfile.findUnique({ where: { id }, select: { status: true } });
  if (!current) throw new NotFoundError("Profil introuvable.");
  if (current.status === "ANONYMIZED")
    throw new ValidationError("Profil anonymisé : action impossible.");
  await prisma.youthProfile.update({
    where: { id },
    data: { status: archived ? "ARCHIVED" : "ACTIVE", archivedAt: archived ? new Date() : null },
  });
  await audit({
    action: archived ? "PROFILE_ARCHIVED" : "PROFILE_RESTORED",
    entityType: "YouthProfile",
    entityId: id,
    actorId: ctx.actorId,
    ipHash: ctx.ipHash,
  });
}

/**
 * Anonymisation : efface les champs identifiants, conserve les données
 * statistiques (sexe, année de naissance, quartier, formation, situation…).
 * Irréversible. Libère le numéro de téléphone.
 */
export async function anonymizeYouthProfile(id: string, ctx: AdminContext): Promise<void> {
  const current = await prisma.youthProfile.findUnique({
    where: { id },
    select: { status: true, birthDate: true },
  });
  if (!current) throw new NotFoundError("Profil introuvable.");
  if (current.status === "ANONYMIZED") return;
  // On conserve l'année de naissance (1er juillet) pour garder les tranches d'âge approximatives.
  const approxBirth = new Date(current.birthDate.getFullYear(), 6, 1);
  await prisma.$transaction(async (tx) => {
    await tx.youthProfile.update({
      where: { id },
      data: {
        firstName: "Anonyme",
        lastName: "-",
        phone: "-",
        phoneNormalized: null,
        email: null,
        quartierOther: null,
        customSkills: null,
        customInterests: null,
        birthDate: approxBirth,
        status: "ANONYMIZED",
        anonymizedAt: new Date(),
      },
    });
    await tx.education.updateMany({
      where: { youthId: id },
      data: { institution: null, diploma: null, otherTraining: null, vocationalTraining: null },
    });
    await tx.project.updateMany({ where: { youthId: id }, data: { name: null } });
    await tx.consent.updateMany({
      where: { youthId: id },
      data: { ipHash: null, userAgent: null },
    });
    await audit(
      {
        action: "PROFILE_ANONYMIZED",
        entityType: "YouthProfile",
        entityId: id,
        actorId: ctx.actorId,
        ipHash: ctx.ipHash,
      },
      tx,
    );
  });
}

/** Suppression définitive (SUPER_ADMIN uniquement) - journalisée avant suppression. */
export async function deleteYouthProfile(id: string, ctx: AdminContext): Promise<void> {
  const current = await prisma.youthProfile.findUnique({ where: { id }, select: { id: true } });
  if (!current) throw new NotFoundError("Profil introuvable.");
  await audit({
    action: "PROFILE_DELETED",
    entityType: "YouthProfile",
    entityId: id,
    actorId: ctx.actorId,
    ipHash: ctx.ipHash,
  });
  await prisma.youthProfile.delete({ where: { id } });
}

/**
 * Anonymise tous les profils actifs plus anciens que la durée de conservation.
 * Retourne le nombre de profils traités.
 */
export async function countExpiredProfiles(retentionMonths: number): Promise<number> {
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - retentionMonths);
  return prisma.youthProfile.count({
    where: { status: { in: ["ACTIVE", "ARCHIVED"] }, createdAt: { lt: cutoff } },
  });
}

export async function applyRetentionPolicy(
  retentionMonths: number,
  ctx: AdminContext,
): Promise<number> {
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - retentionMonths);
  const expired = await prisma.youthProfile.findMany({
    where: { status: { in: ["ACTIVE", "ARCHIVED"] }, createdAt: { lt: cutoff } },
    select: { id: true },
  });
  for (const p of expired) await anonymizeYouthProfile(p.id, ctx);
  return expired.length;
}
