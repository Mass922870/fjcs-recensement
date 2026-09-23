import { describe, expect, it } from "vitest";
import { MINUTES_TRANSITIONS, minutesSchema } from "@/schemas/management/minutes";
import type { MinutesStatus } from "@/lib/generated/prisma/enums";

const ALL: MinutesStatus[] = ["BROUILLON", "EN_REVISION", "A_VALIDER", "VALIDE", "ARCHIVE"];

describe("Cycle de vie du procès-verbal", () => {
  it("suit le circuit brouillon → révision → validation", () => {
    expect(MINUTES_TRANSITIONS.BROUILLON).toEqual(["EN_REVISION"]);
    expect(MINUTES_TRANSITIONS.EN_REVISION).toContain("A_VALIDER");
    expect(MINUTES_TRANSITIONS.A_VALIDER).toContain("VALIDE");
  });

  it("interdit de sauter directement du brouillon à la validation", () => {
    expect(MINUTES_TRANSITIONS.BROUILLON).not.toContain("VALIDE");
    expect(MINUTES_TRANSITIONS.BROUILLON).not.toContain("A_VALIDER");
  });

  it("ne laisse pas un PV validé revenir en arrière par simple transition", () => {
    // La seule suite possible est l'archivage : toute reprise passe par une
    // nouvelle version, ce qui garantit la traçabilité des corrections.
    expect(MINUTES_TRANSITIONS.VALIDE).toEqual(["ARCHIVE"]);
    expect(MINUTES_TRANSITIONS.VALIDE).not.toContain("EN_REVISION");
    expect(MINUTES_TRANSITIONS.ARCHIVE).toEqual([]);
  });

  it("ne déclare aucune transition vers un état inexistant", () => {
    for (const from of ALL) {
      for (const to of MINUTES_TRANSITIONS[from]) expect(ALL).toContain(to);
    }
  });

  it("n'autorise jamais une transition vers soi-même", () => {
    for (const from of ALL) expect(MINUTES_TRANSITIONS[from]).not.toContain(from);
  });

  it("accepte un procès-verbal sans aucune section remplie", () => {
    const parsed = minutesSchema.safeParse({
      chairId: "",
      secretaryId: "",
      introduction: "",
      proceedings: "",
      observations: "",
      misc: "",
      conclusion: "",
      points: [],
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.introduction).toBeUndefined();
  });

  it("borne le nombre de points repris au procès-verbal", () => {
    const points = Array.from({ length: 41 }, (_, i) => ({
      agendaItemId: `a${i}`,
      discussion: "",
      decision: "",
    }));
    expect(minutesSchema.safeParse({ points }).success).toBe(false);
  });
});
