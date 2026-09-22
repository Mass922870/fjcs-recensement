/**
 * Crée (ou met à jour) un compte administrateur.
 *
 *   npm run create-admin -- --email admin@fjcs.sn --name "Prénom Nom" --role SUPER_ADMIN
 *
 * Le mot de passe est demandé de manière interactive (jamais passé en argument
 * pour ne pas apparaître dans l'historique du shell), ou lu depuis ADMIN_PASSWORD.
 */
import "dotenv/config";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, type Role } from "../lib/generated/prisma/client";
import { getDirectDatabaseUrl } from "../lib/env";
import { hashPassword } from "../lib/auth/password";
import { passwordSchema } from "../schemas/auth";

const ROLES: Role[] = ["SUPER_ADMIN", "ADMIN", "ANALYST", "VIEWER"];

function arg(name: string): string | undefined {
  const idx = process.argv.indexOf(`--${name}`);
  return idx !== -1 ? process.argv[idx + 1] : undefined;
}

async function main() {
  const email = arg("email")?.toLowerCase().trim();
  const name = arg("name")?.trim();
  const role = (arg("role") ?? "SUPER_ADMIN") as Role;

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
    update: { name, role, passwordHash, isActive: true, failedLoginAttempts: 0, lockedUntil: null },
    create: { email, name, role, passwordHash },
  });
  console.log(`✓ Compte ${user.role} prêt : ${user.email}`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
