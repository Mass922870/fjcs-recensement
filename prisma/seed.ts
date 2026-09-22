/**
 * Seed des référentiels (idempotent) : quartiers, compétences, centres
 * d'intérêt, besoins et paramètres par défaut.
 *
 * Aucune donnée personnelle ni profil fictif ici - voir `prisma/seed-demo.ts`.
 * Lancement : npm run db:seed
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client";
import {
  SEED_EDUCATION_LEVELS,
  SEED_EMPLOYMENT_STATUSES,
  SEED_INTERESTS,
  SEED_NEEDS,
  SEED_QUARTIERS,
  SEED_SECTORS,
  SEED_SKILL_CATEGORIES,
  SEED_SKILLS,
} from "../lib/constants/referentials";
import { DEFAULT_SETTINGS } from "../lib/constants/settings";
import { getDirectDatabaseUrl } from "../lib/env";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: getDirectDatabaseUrl() }),
});

async function main() {
  console.log("→ Référentiels");

  // Les listes de départ ne sont créées que si elles sont absentes : les libellés
  // modifiés dans Paramètres › Référentiels ne sont jamais écrasés.
  for (const [i, q] of SEED_QUARTIERS.entries()) {
    await prisma.quartier.upsert({
      where: { slug: q.slug },
      update: {},
      create: {
        slug: q.slug,
        name: q.name,
        latitude: q.latitude ?? null,
        longitude: q.longitude ?? null,
        sortOrder: i,
      },
    });
  }
  console.log(`  ✓ ${SEED_QUARTIERS.length} quartiers`);

  for (const [i, c] of SEED_SKILL_CATEGORIES.entries()) {
    await prisma.skillCategory.upsert({
      where: { slug: c.slug },
      update: {},
      create: { ...c, sortOrder: i },
    });
  }
  const categories = new Map((await prisma.skillCategory.findMany()).map((c) => [c.slug, c.id]));
  for (const [i, s] of SEED_SKILLS.entries()) {
    const categoryId = categories.get(s.category);
    if (!categoryId) continue;
    await prisma.skill.upsert({
      where: { slug: s.slug },
      update: {},
      create: { slug: s.slug, label: s.label, categoryId, sortOrder: i },
    });
  }
  console.log(`  ✓ ${SEED_SKILL_CATEGORIES.length} catégories, ${SEED_SKILLS.length} compétences`);

  for (const [i, l] of SEED_EDUCATION_LEVELS.entries()) {
    await prisma.educationLevel.upsert({
      where: { slug: l.slug },
      update: {},
      create: { ...l, sortOrder: i },
    });
  }
  console.log(`  ✓ ${SEED_EDUCATION_LEVELS.length} niveaux d'études`);

  for (const [i, st] of SEED_EMPLOYMENT_STATUSES.entries()) {
    await prisma.employmentStatus.upsert({
      where: { slug: st.slug },
      update: {},
      create: {
        slug: st.slug,
        label: st.label,
        kind: st.kind,
        requiresDetail: st.requiresDetail ?? false,
        sortOrder: i,
      },
    });
  }
  console.log(`  ✓ ${SEED_EMPLOYMENT_STATUSES.length} situations professionnelles`);

  for (const [i, sec] of SEED_SECTORS.entries()) {
    await prisma.sector.upsert({
      where: { slug: sec.slug },
      update: {},
      create: { ...sec, sortOrder: i },
    });
  }
  console.log(`  ✓ ${SEED_SECTORS.length} secteurs d'activité`);

  for (const [i, it] of SEED_INTERESTS.entries()) {
    await prisma.interest.upsert({
      where: { slug: it.slug },
      update: {},
      create: { ...it, sortOrder: i },
    });
  }
  console.log(`  ✓ ${SEED_INTERESTS.length} centres d'intérêt`);

  for (const [i, n] of SEED_NEEDS.entries()) {
    await prisma.need.upsert({
      where: { slug: n.slug },
      update: { isSystem: n.isSystem ?? false },
      create: {
        slug: n.slug,
        label: n.label,
        question: n.question,
        isSystem: n.isSystem ?? false,
        sortOrder: i,
      },
    });
  }
  console.log(`  ✓ ${SEED_NEEDS.length} besoins`);

  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
    await prisma.setting.upsert({
      where: { key },
      update: {},
      create: { key, value },
    });
  }
  console.log(`  ✓ ${Object.keys(DEFAULT_SETTINGS).length} paramètres par défaut`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
