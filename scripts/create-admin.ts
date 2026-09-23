/**
 * Crée (ou met à jour) un compte administrateur.
 *
 *   npm run create-admin -- --email admin@fjcs.sn --name "Prénom Nom" --role SUPER_ADMIN
 *
 * Le rôle dans l'espace interne s'ajoute avec --management-role (facultatif,
 * aucun accès par défaut) :
 *   npm run create-admin -- --email ... --name ... --management-role PRESIDENT
 *
 * Le mot de passe est demandé de manière interactive (jamais passé en argument
 * pour ne pas apparaître dans l'historique du shell), ou lu depuis ADMIN_PASSWORD.
 */
import "dotenv/config";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, type ManagementRole, type Role } from "../lib/generated/prisma/client";
import { getDirectDatabaseUrl } from "../lib/env";
import { hashPassword } from "../lib/auth/password";
import { passwordSchema } from "../schemas/auth";

const ROLES: Role[] = ["SUPER_ADMIN", "ADMIN", "ANALYST", "VIEWER"];
const MANAGEMENT_ROLES: ManagementRole[] = [
  "SUPER_ADMIN",
  "PRESIDENT",
  "SECRETAIRE",
  "RESPONSABLE_COMMISSION",
  "MEMBRE_BUREAU",
  "VIEWER",
];

function arg(name: string): string | undefined {
  const idx = process.argv.indexOf(`--${name}`);
  return idx !== -1 ? process.argv[idx + 1] : undefined;
}

async function main() {
  const email = arg("email")?.toLowerCase().trim();
  const name = arg("name")?.trim();
  const role = (arg("role") ?? "SUPER_ADMIN") as Role;
  const managementRoleArg = arg("management-role");
  const managementRole = managementRoleArg ? (managementRoleArg as ManagementRole) : undefined;

  if (!email || !name) {
    console.error(
      "Usage : npm run create-admin -- --email <email> --name <nom> [--role SUPER_ADMIN]",
    );
    process.exit(1);
  }
  if (!ROLES.includes(role)) {
    console.error(`Rôle invalide. Valeurs possibles : ${ROLES.join(", ")}`);
    process.exit(1);
  }
  if (managementRole && !MANAGEMENT_ROLES.includes(managementRole)) {
    console.error(`Rôle management invalide. Valeurs possibles : ${MANAGEMENT_ROLES.join(", ")}`);
    process.exit(1);
  }

  let password = process.env.ADMIN_PASSWORD;
  if (!password) {
    const rl = createInterface({ input: stdin, output: stdout });
    password = await rl.question("Mot de passe (min. 10 caractères, lettres + chiffres) : ");
    rl.close();
  }
  const parsed = passwordSchema.safeParse(password);
  if (!parsed.success) {
    console.error(parsed.error.issues.map((i) => i.message).join("\n"));
    process.exit(1);
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: getDirectDatabaseUrl() }),
  });
  const passwordHash = await hashPassword(parsed.data);
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      name,
      role,
      passwordHash,
      isActive: true,
      failedLoginAttempts: 0,
      lockedUntil: null,
      // Omis si l'option n'est pas passée : on ne retire jamais un accès interne
      // par inadvertance en réinitialisant un mot de passe.
      ...(managementRole ? { managementRole } : {}),
    },
    create: { email, name, role, passwordHash, managementRole },
  });
  console.log(`✓ Compte ${user.role} prêt : ${user.email}`);
  console.log(
    user.managementRole
      ? `  FJCS Management : ${user.managementRole}`
      : "  FJCS Management : aucun accès",
  );
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
