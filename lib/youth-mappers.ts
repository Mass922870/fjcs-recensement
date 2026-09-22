import type { CensusFormInput } from "@/schemas/youth";
import type { YouthProfileDetail } from "@/services/youth-list.service";

/** Convertit une fiche en base en valeurs de formulaire (édition admin). */
export function profileToFormInput(p: YouthProfileDetail): CensusFormInput {
  return {
    personal: {
      firstName: p.firstName,
      lastName: p.lastName,
      birthDate: p.birthDate.toISOString().slice(0, 10),
      gender: p.gender,
      phone: p.phone,
      email: p.email ?? "",
      quartierSlug: p.quartier?.slug ?? "",
      quartierOther: p.quartierOther ?? "",
    },
    education: {
      levelSlug: p.education?.level.slug ?? "",
      field: p.education?.field ?? "",
      institution: p.education?.institution ?? "",
      diploma: p.education?.diploma ?? "",
      vocationalTraining: p.education?.vocationalTraining ?? "",
      otherTraining: p.education?.otherTraining ?? "",
    },
    employment: {
      statusSlug: p.employment?.status.slug ?? "",
      otherDetail: p.employment?.otherDetail ?? "",
      project:
        p.employment?.status.kind === "ENTREPRENEUR"
          ? {
              sector: p.project?.sector ?? "",
              name: p.project?.name ?? "",
              isFormalized: p.project?.isFormalized ?? false,
              sinceMonths: p.project?.sinceMonths ?? undefined,
              teamSize: p.project?.teamSize ?? undefined,
            }
          : undefined,
    },
    skills: { skillSlugs: p.skills.map((s) => s.skill.slug), customSkills: p.customSkills ?? "" },
    needs: { needSlugs: p.needs.map((n) => n.need.slug) },
    interests: {
      interestSlugs: p.interests.map((i) => i.interest.slug),
      customInterests: p.customInterests ?? "",
    },
    consent: { consent: true },
  };
}
