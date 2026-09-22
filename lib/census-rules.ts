import type { CensusRules } from "@/schemas/youth";
import type { FormReferentials } from "@/services/referentials.service";

/** Dérive les règles de validation conditionnelle des référentiels (importable côté client). */
export function rulesFromReferentials(refs: Pick<FormReferentials, "employmentStatuses">): CensusRules {
  return {
    entrepreneurStatusSlugs: refs.employmentStatuses.filter((s) => s.kind === "ENTREPRENEUR").map((s) => s.slug),
    detailStatusSlugs: refs.employmentStatuses.filter((s) => s.requiresDetail).map((s) => s.slug),
  };
}
