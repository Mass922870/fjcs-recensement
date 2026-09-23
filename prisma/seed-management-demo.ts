/**
 * DONNÉES DE DÉMONSTRATION DE FJCS MANAGEMENT - développement uniquement.
 *
 * Crée des commissions, des membres et des réunions fictives (isDemo = true)
 * pour parcourir l'espace interne avec du contenu. Ces enregistrements sont
 * exclus partout sauf si SHOW_DEMO_DATA=true, et ce script refuse de
 * s'exécuter en production.
 *
 *   npm run db:seed-management            → crée le jeu de démonstration
 *   npm run db:seed-management -- --purge → le supprime entièrement
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client";
import { getDirectDatabaseUrl } from "../lib/env";

if (process.env.NODE_ENV === "production") {
  console.error("Refusé : le seed de démonstration ne s'exécute jamais en production.");
  process.exit(1);
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: getDirectDatabaseUrl() }),
});

const COMMISSIONS = [
  { name: "Commission Transformation Numérique et Innovation", acronym: "CTNI" },
  { name: "Commission Culture et Animation", acronym: "CCA" },
  { name: "Commission Sport et Loisirs", acronym: "CSL" },
  { name: "Commission Formation et Emploi", acronym: "CFE" },
];

const MEMBERS: [string, string, string, number][] = [
  ["Mamadou", "Kane", "Président", 0],
  ["Awa", "Sow", "Secrétaire générale", 0],
  ["Ibrahima", "Diouf", "Trésorier", 3],
  ["Fatou", "Ndiaye", "Responsable de commission", 1],
  ["Seynabou", "Wade", "Responsable de commission", 2],
  ["Ousmane", "Camara", "Membre", 0],
  ["Aminata", "Lô", "Membre", 1],
  ["Cheikh", "Sarr", "Membre", 2],
  ["Bineta", "Sy", "Membre", 3],
  ["Moussa", "Ba", "Membre", 0],
];

/** Décalage en jours par rapport à aujourd'hui, pour rester toujours pertinent. */
const MEETINGS: [string, string, number, string, string, number | null][] = [
  ["Réunion ordinaire du bureau", "BUREAU", -21, "17:00", "19:30", null],
  ["Commission numérique : lancement du recensement", "COMMISSION", -14, "18:00", "20:00", 0],
  ["Rencontre avec la mairie de Sangalkam", "PARTENAIRES", -7, "10:00", "12:00", null],
  ["Réunion ordinaire du bureau", "BUREAU", 2, "17:00", "19:30", null],
  ["Commission culture : préparation du festival", "COMMISSION", 5, "18:30", "20:30", 1],
  ["Assemblée générale ordinaire", "ASSEMBLEE_GENERALE", 16, "10:00", "13:00", null],
  ["Commission formation : bilan des ateliers", "COMMISSION", 24, "18:00", "20:00", 3],
];

const AGENDA = [
  ["Ouverture et mot du président", "", 10],
  ["Approbation du procès-verbal précédent", "", 10],
  ["Point sur les actions en cours", "Suivi des décisions de la séance précédente.", 30],
  ["Préparation des activités du trimestre", "", 25],
  ["Questions diverses", "", 15],
];

function isoDay(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

async function purge() {
  const meetings = await prisma.meeting.deleteMany({ where: { isDemo: true } });
  const members = await prisma.member.deleteMany({ where: { isDemo: true } });
  const commissions = await prisma.commission.deleteMany({
    where: { name: { in: COMMISSIONS.map((c) => c.name) } },
  });
  console.log(
    `Supprimé : ${meetings.count} réunions, ${members.count} membres, ${commissions.count} commissions.`,
  );
}

async function main() {
  if (process.argv.includes("--purge")) {
    await purge();
    await prisma.$disconnect();
    return;
  }

  const existing = await prisma.meeting.count({ where: { isDemo: true } });
  if (existing > 0) {
    console.error(
      `Déjà ${existing} réunions de démonstration. Utilisez --purge pour les supprimer d'abord.`,
    );
    process.exit(1);
  }

  const commissions = [];
  for (const [index, c] of COMMISSIONS.entries()) {
    commissions.push(
      await prisma.commission.upsert({
        where: { name: c.name },
        update: {},
        create: { ...c, sortOrder: index },
      }),
    );
  }

  const members = [];
  for (const [firstName, lastName, role, commissionIndex] of MEMBERS) {
    members.push(
      await prisma.member.create({
        data: {
          firstName,
          lastName,
          role,
          commissionId: commissions[commissionIndex]!.id,
          status: "ACTIF",
          isDemo: true,
          joinedAt: new Date("2025-01-15"),
          phone: "77 000 00 00",
        },
      }),
    );
  }

  let rank = 1;
  for (const [title, type, offset, startTime, endTime, commissionIndex] of MEETINGS) {
    const day = isoDay(offset);
    const year = new Date(`${day}T12:00:00`).getFullYear();
    // Les séances passées sont clôturées, les futures restent planifiées.
    const status = offset < 0 ? "TERMINEE" : "PLANIFIEE";
    await prisma.meeting.create({
      data: {
        reference: `REU-${year}-${String(9000 + rank++).padStart(4, "0")}`,
        title,
        type: type as never,
        status,
        startsAt: new Date(`${day}T${startTime}:00`),
        endsAt: new Date(`${day}T${endTime}:00`),
        location: "Siège du FJCS, Sangalkam",
        description: "Séance de démonstration, générée pour le développement.",
        commissionId: commissionIndex === null ? null : commissions[commissionIndex]!.id,
        organizerId: members[1]!.id,
        isDemo: true,
        agenda: {
          create: AGENDA.slice(0, 3 + (rank % 3)).map(([t, d, duration], position) => ({
            position,
            title: t as string,
            description: (d as string) || null,
            duration: duration as number,
          })),
        },
        participants: { create: members.map((m) => ({ memberId: m.id })) },
      },
    });
  }

  console.log(
    `✓ ${commissions.length} commissions, ${members.length} membres, ${MEETINGS.length} réunions de démonstration.`,
  );
  console.log("  Visibles en développement avec SHOW_DEMO_DATA=true dans .env");
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
