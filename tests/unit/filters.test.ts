import { describe, expect, it } from "vitest";
import { countActiveFilters, parseStatsFilters } from "@/schemas/filters";
import { parseYouthListParams } from "@/schemas/youth-list";
import { ageBracketOf, birthDateRangeForBracket, computeAge } from "@/lib/age";

describe("filtres globaux", () => {
  it("ignore les valeurs invalides sans tout rejeter", () => {
    const f = parseStatsFilters({
      gender: "FEMALE",
      age: "99-100",
      from: "2026-01-01",
      employment: "etudiant",
    });
    expect(f.gender).toBe("FEMALE");
    expect(f.from).toBe("2026-01-01");
    expect(f.age).toBeUndefined();
    expect(f.employment).toBe("etudiant");
    expect(countActiveFilters(f)).toBe(3);
  });

  it("applique des valeurs par défaut sûres à la liste", () => {
    const p = parseYouthListParams({ page: "-3", perPage: "9999", sort: "hack" });
    expect(p.page).toBe(1);
    expect(p.perPage).toBe(20);
    expect(p.sort).toBe("createdAt");
  });
});

describe("âges", () => {
  it("calcule l'âge et la tranche", () => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 22);
    expect(computeAge(d)).toBe(22);
    expect(ageBracketOf(22)).toBe("20-24");
    expect(ageBracketOf(40)).toBe("36+");
  });

  it("borne les dates de naissance d'une tranche", () => {
    const { gte, lte } = birthDateRangeForBracket("20-24");
    expect(computeAge(lte)).toBe(20);
    expect(computeAge(gte)).toBe(24);
  });
});
