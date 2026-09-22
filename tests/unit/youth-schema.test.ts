import { describe, expect, it } from "vitest";
import { createCensusSchema, createEmploymentSchema, createPersonalSchema, skillsSchema } from "@/schemas/youth";

import {
  TEST_BOUNDS as bounds,
  TEST_RULES,
  isoYearsAgo,
  validCensusInput as validInput,
} from "../helpers/census-fixtures";

const employmentSchema = createEmploymentSchema(TEST_RULES);

describe("schéma personnel", () => {
  const schema = createPersonalSchema(bounds);

  it("accepte un profil valide", () => {
    expect(schema.safeParse(validInput().personal).success).toBe(true);
  });

  it("refuse un âge hors bornes", () => {
    const tooYoung = { ...validInput().personal, birthDate: isoYearsAgo(12) };
    const tooOld = { ...validInput().personal, birthDate: isoYearsAgo(40) };
    expect(schema.safeParse(tooYoung).success).toBe(false);
    expect(schema.safeParse(tooOld).success).toBe(false);
  });

  it("refuse un téléphone invalide", () => {
    const r = schema.safeParse({ ...validInput().personal, phone: "12" });
    expect(r.success).toBe(false);
  });

  it("exige la précision du quartier si « autre »", () => {
    const r = schema.safeParse({
      ...validInput().personal,
      quartierSlug: "autre",
      quartierOther: "",
    });
    expect(r.success).toBe(false);
    const ok = schema.safeParse({
      ...validInput().personal,
      quartierSlug: "autre",
      quartierOther: "Cité Soleil",
    });
    expect(ok.success).toBe(true);
  });

  it("transforme l'e-mail vide en undefined", () => {
    const r = schema.safeParse(validInput().personal);
    expect(r.success && r.data.email).toBeUndefined();
  });
});

describe("schéma situation professionnelle", () => {
  it("exige le domaine d'activité pour un entrepreneur", () => {
    const r = employmentSchema.safeParse({
      statusSlug: "entrepreneur",
      project: { sector: "", isFormalized: false, sinceMonths: "", teamSize: "" },
    });
    expect(r.success).toBe(false);
  });

  it("accepte des champs numériques facultatifs vides", () => {
    const r = employmentSchema.safeParse({
      statusSlug: "entrepreneur",
      project: { sector: "Commerce", isFormalized: true, sinceMonths: "", teamSize: "" },
    });
    expect(r.success).toBe(true);
    expect(r.success && r.data.project?.sinceMonths).toBeUndefined();
  });

  it("coerce les nombres saisis", () => {
    const r = employmentSchema.safeParse({
      statusSlug: "entrepreneur",
      project: { sector: "Commerce", isFormalized: true, sinceMonths: "18", teamSize: "3" },
    });
    expect(r.success && r.data.project?.teamSize).toBe(3);
  });
});

describe("schéma compétences", () => {
  it("exige au moins une compétence ou une compétence libre", () => {
    expect(skillsSchema.safeParse({ skillSlugs: [], customSkills: "" }).success).toBe(false);
    expect(skillsSchema.safeParse({ skillSlugs: [], customSkills: "Soudure" }).success).toBe(true);
    expect(skillsSchema.safeParse({ skillSlugs: ["data"], customSkills: "" }).success).toBe(true);
  });
});

describe("schéma complet", () => {
  it("valide un formulaire complet", () => {
    const r = createCensusSchema(bounds).safeParse(validInput());
    expect(r.success).toBe(true);
  });

  it("refuse sans consentement", () => {
    const r = createCensusSchema(bounds).safeParse({
      ...validInput(),
      consent: { consent: false },
    });
    expect(r.success).toBe(false);
  });
});
