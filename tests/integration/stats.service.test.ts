// @vitest-environment node
import "dotenv/config";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { createYouthProfile } from "@/services/youth.service";
import {
  getCrossTab,
  getDashboardKpis,
  getDistributions,
  getQuartierAggregates,
} from "@/services/stats.service";
import { createCensusSchema } from "@/schemas/youth";
import { TEST_BOUNDS, TEST_RULES, validCensusInput } from "../helpers/census-fixtures";

const hasDb = Boolean(process.env.DATABASE_URL);
const ids: string[] = [];
const tag = String(Date.now()).slice(-6);

describe.skipIf(!hasDb)("stats.service (intégration PostgreSQL)", () => {
  beforeAll(async () => {
    // Deux profils de test : une femme entrepreneure à Diamaguène, un homme étudiant à Bayal.
    const a = validCensusInput();
    a.personal.phone = `75 1${tag}`;
    a.personal.quartierSlug = "diamaguene";
    a.employment = {
      statusSlug: "entrepreneur",
      otherDetail: "",
      project: { sector: "Commerce", name: "", isFormalized: true, sinceMonths: 12, teamSize: 2 },
    };
    a.needs.needSlugs = ["financement", "formation"];
    const b = validCensusInput();
    b.personal.phone = `75 2${tag}`;
    b.personal.gender = "MALE";
    b.personal.quartierSlug = "bayal";
    b.employment = { statusSlug: "etudiant", otherDetail: "", project: undefined };
    b.needs.needSlugs = [];
    for (const input of [a, b]) {
      const created = await createYouthProfile(createCensusSchema(TEST_BOUNDS, TEST_RULES).parse(input), {
        source: "ADMIN",
      });
      ids.push(created.id);
    }
  });

  afterAll(async () => {
    await prisma.auditLog.deleteMany({ where: { entityId: { in: ids } } });
    await prisma.youthProfile.deleteMany({ where: { id: { in: ids } } });
    await prisma.$disconnect();
  });

  it("les KPI reflètent les profils actifs non-démo", async () => {
    const all = await getDashboardKpis({});
    expect(all.total).toBeGreaterThanOrEqual(2);
    const women = await getDashboardKpis({
      gender: "FEMALE",
      quartier: "diamaguene",
      employment: "entrepreneur",
    });
    expect(women.total).toBeGreaterThanOrEqual(1);
    expect(women.entrepreneurs).toBe(women.total);
    expect(women.wantTraining).toBeGreaterThanOrEqual(1);
  });

  it("les distributions somment à l'effectif", async () => {
    const k = await getDashboardKpis({});
    const d = await getDistributions({});
    const sum = (rows: { value: number }[]) => rows.reduce((s, r) => s + r.value, 0);
    expect(sum(d.gender)).toBe(k.total);
    expect(sum(d.age)).toBe(k.total);
    expect(sum(d.employment)).toBe(k.total);
    expect(sum(d.education)).toBe(k.total);
  });

  it("le tableau croisé est cohérent", async () => {
    const ct = await getCrossTab("gender", "employment", { need: "financement" });
    expect(ct.total).toBeGreaterThanOrEqual(1);
    expect(ct.rows).toContain("Femme");
    expect(ct.cols).toContain("Entrepreneur(e)");
    const rowSum = Object.values(ct.rowTotals).reduce((s, v) => s + v, 0);
    expect(rowSum).toBe(ct.total);
  });

  it("la cartographie n'expose que des agrégats par quartier", async () => {
    const agg = await getQuartierAggregates({});
    const diamaguene = agg.find((q) => q.slug === "diamaguene");
    expect(diamaguene?.count).toBeGreaterThanOrEqual(1);
    for (const q of agg)
      expect(Object.keys(q).sort()).toEqual([
        "count",
        "id",
        "latitude",
        "longitude",
        "name",
        "slug",
      ]);
  });
});
