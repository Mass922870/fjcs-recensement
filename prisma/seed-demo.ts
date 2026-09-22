/**
 * DONNÉES DE DÉMONSTRATION - développement uniquement.
 *
 * Crée 100 profils fictifs (isDemo = true, source = SEED) pour tester les
 * dashboards. Ils sont exclus des statistiques sauf si SHOW_DEMO_DATA=true et
 * ne sont jamais affichés en production. Refuse de s'exécuter si NODE_ENV=production.
 *
 *   npm run db:seed-demo            → crée les 100 profils
 *   npm run db:seed-demo -- --purge → supprime tous les profils de démonstration
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
  SEED_SKILLS,
} from "../lib/constants/referentials";
import { getDirectDatabaseUrl } from "../lib/env";
import { createYouthProfile } from "../services/youth.service";
import type { CensusFormOutput } from "../schemas/youth";

if (process.env.NODE_ENV === "production") {
  console.error("Refusé : le seed de démonstration ne s'exécute jamais en production.");
  process.exit(1);
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: getDirectDatabaseUrl() }),
});

// Générateur pseudo-aléatoire déterministe (mulberry32) → seed reproductible.
function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = rng(20260921);
const pick = <T>(arr: readonly T[]): T => arr[Math.floor(rand() * arr.length)]!;
const pickMany = <T>(arr: readonly T[], min: number, max: number): T[] => {
  const n = min + Math.floor(rand() * (max - min + 1));
  const copy = [...arr];
  const out: T[] = [];
  while (out.length < n && copy.length)
    out.push(copy.splice(Math.floor(rand() * copy.length), 1)[0]!);
  return out;
};
const chance = (p: number) => rand() < p;

const FIRST_F = [
  "Aminata",
  "Fatou",
  "Mariama",
  "Awa",
  "Khady",
  "Ndèye",
  "Adja",
  "Bineta",
  "Sokhna",
  "Rokhaya",
  "Coumba",
  "Astou",
  "Dieynaba",
  "Maimouna",
  "Seynabou",
];
const FIRST_M = [
  "Moussa",
  "Ibrahima",
  "Ousmane",
  "Mamadou",
  "Cheikh",
  "Abdou",
  "Modou",
  "Pape",
  "Serigne",
  "Lamine",
  "Babacar",
  "Assane",
  "Omar",
  "Idrissa",
  "Saliou",
];
const LAST = [
  "Ndiaye",
  "Diop",
  "Fall",
  "Sarr",
  "Sow",
  "Gueye",
  "Faye",
  "Diallo",
  "Ba",
  "Mbaye",
  "Sy",
  "Thiam",
  "Seck",
  "Cissé",
  "Diouf",
  "Kane",
  "Ndour",
  "Lô",
  "Wade",
  "Camara",
];
const FIELDS = [
  "Informatique",
  "Gestion",
  "Droit",
  "Économie",
  "Lettres modernes",
  "Sciences",
  "Agronomie",
  "Communication",
  "Comptabilité",
  "Électrotechnique",
];
const INSTITUTIONS = [
  "Lycée de Sangalkam",
  "UCAD",
  "UVS",
  "ISEP Thiès",
  "CFPT Sénégal-Japon",
  "ESP Dakar",
  "Lycée Seydina Limamou Laye",
  "Centre de formation de Rufisque",
];

function makeProfile(i: number): { data: CensusFormOutput; createdAt: Date } {
  const gender = chance(0.52) ? "FEMALE" : "MALE";
  const age = 15 + Math.floor(rand() * 21); // 15–35
  const birth = new Date();
  birth.setFullYear(birth.getFullYear() - age);
  birth.setMonth(Math.floor(rand() * 12), 1 + Math.floor(rand() * 28));
  const status = pick(SEED_EMPLOYMENT_STATUSES);
  const isEntrepreneur = status.kind === "ENTREPRENEUR";
  const level =
    age < 18 ? pick(["college", "lycee", "primaire"]) : pick(SEED_EDUCATION_LEVELS).slug;
  const quartier = pick(SEED_QUARTIERS.filter((q) => q.slug !== "autre"));
  const createdAt = new Date(Date.now() - Math.floor(rand() * 180) * 86_400_000);

  const needSlugs = pickMany(
    SEED_NEEDS.map((n) => n.slug),
    0,
    4,
  );
  if (status.kind === "JOB_SEEKER" && !needSlugs.includes("recherche-emploi"))
    needSlugs.push("recherche-emploi");
  if (isEntrepreneur && chance(0.7)) {
    if (!needSlugs.includes("financement")) needSlugs.push("financement");
    if (!needSlugs.includes("projet-entrepreneurial")) needSlugs.push("projet-entrepreneurial");
  }

  const data: CensusFormOutput = {
    personal: {
      firstName: gender === "FEMALE" ? pick(FIRST_F) : pick(FIRST_M),
      lastName: pick(LAST),
      birthDate: birth.toISOString().slice(0, 10),
      gender,
      // Remplacé plus bas par un numéro de la plage 70 000 xx xx (démo).
      phone: "",
      email: chance(0.4) ? `demo${i}@example.test` : undefined,
      quartierSlug: quartier.slug,
      quartierOther: undefined,
    },
    education: {
      levelSlug: level,
      field: chance(0.6) ? pick(FIELDS) : undefined,
      institution: chance(0.6) ? pick(INSTITUTIONS) : undefined,
      diploma: chance(0.4) ? "Diplôme (démo)" : undefined,
      vocationalTraining: chance(0.3) ? "Formation professionnelle (démo)" : undefined,
      otherTraining: undefined,
    },
    employment: {
      statusSlug: status.slug,
      otherDetail: status.requiresDetail ? "Année de césure (démo)" : undefined,
      project: isEntrepreneur
        ? {
            sector: pick(SEED_SECTORS).label,
            name: chance(0.6) ? `Activité démo ${i}` : undefined,
            isFormalized: chance(0.3),
            sinceMonths: Math.floor(rand() * 60),
            teamSize: 1 + Math.floor(rand() * 5),
          }
        : undefined,
    },
    skills: {
      skillSlugs: pickMany(
        SEED_SKILLS.map((s) => s.slug),
        1,
        5,
      ),
      customSkills: undefined,
    },
    needs: { needSlugs },
    interests: {
      interestSlugs: pickMany(
        SEED_INTERESTS.map((x) => x.slug),
        1,
        4,
      ),
      customInterests: undefined,
    },
    consent: { consent: true },
  };
  return { data, createdAt };
}

async function main() {
  if (process.argv.includes("--purge")) {
    const res = await prisma.youthProfile.deleteMany({ where: { isDemo: true } });
    console.log(`✓ ${res.count} profils de démonstration supprimés`);
    return;
  }

  const existing = await prisma.youthProfile.count({ where: { isDemo: true } });
  if (existing > 0) {
    console.log(
      `Déjà ${existing} profils de démonstration. Utilisez --purge pour les supprimer d'abord.`,
    );
    return;
  }

  let created = 0;
  for (let i = 1; i <= 100; i++) {
    const { data, createdAt } = makeProfile(i);
    // Le numéro doit rester unique et valide : préfixe 70 + 7 chiffres dérivés de i.
    data.personal.phone = `70 ${String(10000000 + i).slice(1)}`;
    try {
      await createYouthProfile(data, { source: "SEED", isDemo: true, createdAt });
      created++;
    } catch (e) {
      console.warn(`  ✗ profil ${i} ignoré :`, (e as Error).message);
    }
  }
  console.log(`✓ ${created} profils de démonstration créés (isDemo = true)`);
  console.log("  Affichez-les en développement avec SHOW_DEMO_DATA=true dans .env");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
