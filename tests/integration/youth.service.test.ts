// @vitest-environment node
import "dotenv/config";
import { afterAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { createYouthProfile } from "@/services/youth.service";
import { createCensusSchema } from "@/schemas/youth";
import { DuplicatePhoneError } from "@/lib/errors";
import { TEST_BOUNDS, validCensusInput as validInput } from "../helpers/census-fixtures";

const hasDb = Boolean(process.env.DATABASE_URL);
const bounds = TEST_BOUNDS;

// Numéro unique par exécution pour ne pas entrer en collision avec les données existantes.
const phone = `76 ${String(Date.now())
  .slice(-7)
  .replace(/(\d{3})(\d{2})(\d{2})/, "$1 $2 $3")}`;
const createdIds: string[] = [];

describe.skipIf(!hasDb)("youth.service (intégration PostgreSQL)", () => {
  afterAll(async () => {
    if (createdIds.length) {
      await prisma.auditLog.deleteMany({ where: { entityId: { in: createdIds } } });
      await prisma.youthProfile.deleteMany({ where: { id: { in: createdIds } } });
    }
    await prisma.$disconnect();
  });

  it("crée un profil complet avec ses relations", async () => {
    const input = validInput();
    input.personal.phone = phone;
    const parsed = createCensusSchema(bounds).parse(input);

    const created = await createYouthProfile(parsed, { source: "PUBLIC", ipHash: "test" });
    createdIds.push(created.id);

    expect(created.participationCode).toMatch(/^FJCS-[A-Z0-9]{6}$/);

    const full = await prisma.youthProfile.findUnique({
      where: { id: created.id },
      include: {
        education: { include: { level: true } },
        employment: { include: { status: true } },
        consent: true,
        skills: true,
        needs: true,
      },
    });
    expect(full?.phoneNormalized).toMatch(/^\+221/);
    expect(full?.education?.level.slug).toBe("licence");
    expect(full?.employment?.status.slug).toBe("etudiant");
    expect(full?.consent?.accepted).toBe(true);
    expect(full?.skills.length).toBe(1);
    expect(full?.needs.length).toBe(1);
  });

  it("détecte un doublon sur le même numéro (formaté différemment)", async () => {
    const input = validInput();
    input.personal.phone = `+221 ${phone}`;
    const parsed = createCensusSchema(bounds).parse(input);

    await expect(createYouthProfile(parsed, { source: "PUBLIC" })).rejects.toBeInstanceOf(
      DuplicatePhoneError,
    );

    const attempts = await prisma.auditLog.count({
      where: { action: "DUPLICATE_ATTEMPT", entityId: createdIds[0] },
    });
    expect(attempts).toBe(1);
  });
});
