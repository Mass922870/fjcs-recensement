import { CENSUS_DEFAULT_VALUES, type CensusFormInput } from "@/schemas/youth";

export const TEST_BOUNDS = { minAge: 15, maxAge: 35 };
export const TEST_RULES = { entrepreneurStatusSlugs: ["entrepreneur"], detailStatusSlugs: ["autre"] };

export function isoYearsAgo(years: number): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - years);
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

/** Saisie complète et valide du formulaire de recensement. */
export function validCensusInput(): CensusFormInput {
  return {
    ...CENSUS_DEFAULT_VALUES,
    personal: {
      firstName: "Aminata",
      lastName: "Ndiaye",
      birthDate: isoYearsAgo(24),
      gender: "FEMALE",
      phone: "77 123 45 67",
      email: "",
      quartierSlug: "diamaguene",
      quartierOther: "",
    },
    education: { ...CENSUS_DEFAULT_VALUES.education, levelSlug: "licence" },
    employment: { statusSlug: "etudiant", otherDetail: "", project: undefined },
    skills: { skillSlugs: ["dev-web"], customSkills: "" },
    needs: { needSlugs: ["formation"] },
    interests: { interestSlugs: ["numerique"], customInterests: "" },
    consent: { consent: true },
  };
}
