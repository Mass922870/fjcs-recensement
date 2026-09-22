"use client";

import { MultiChoice } from "@/components/recensement/multi-choice";
import { StepIntro, TextField } from "@/components/recensement/fields";
import type { CensusFormInput } from "@/schemas/youth";
import type { SimpleOption } from "@/services/referentials.service";

export function StepInterests({ interests }: { interests: SimpleOption[] }) {
  return (
    <div className="space-y-6">
      <StepIntro>
        Quels domaines vous intéressent ? Cela nous aide à vous proposer des activités et événements
        pertinents.
      </StepIntro>
      <MultiChoice name="interests.interestSlugs" options={interests} columns={3} />
      <TextField<CensusFormInput>
        name="interests.customInterests"
        label="Autre centre d'intérêt"
        placeholder="Ex. Cuisine, jeux vidéo, lecture…"
        optional
      />
    </div>
  );
}
