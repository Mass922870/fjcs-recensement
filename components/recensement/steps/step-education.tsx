"use client";

import { SelectField, StepIntro, TextAreaField, TextField } from "@/components/recensement/fields";
import type { CensusFormInput } from "@/schemas/youth";
import type { SimpleOption } from "@/services/referentials.service";

export function StepEducation({ levels }: { levels: SimpleOption[] }) {
  return (
    <div className="space-y-6">
      <StepIntro>
        Votre parcours de formation aide le FJCS à proposer des formations adaptées aux niveaux
        réels des jeunes de Sangalkam.
      </StepIntro>

      <SelectField<CensusFormInput>
        name="education.levelSlug"
        label="Niveau d'études"
        placeholder="Choisir votre niveau"
        options={levels.map((l) => ({ value: l.slug, label: l.label }))}
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <TextField<CensusFormInput>
          name="education.field"
          label="Domaine d'études"
          placeholder="Ex. Informatique, Gestion, Lettres…"
          optional
        />
        <TextField<CensusFormInput>
          name="education.institution"
          label="Établissement"
          placeholder="Ex. Lycée de Sangalkam, UCAD…"
          optional
        />
      </div>

      <TextField<CensusFormInput>
        name="education.diploma"
        label="Diplôme obtenu"
        placeholder="Ex. BAC S2, Licence en droit…"
        optional
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <TextAreaField<CensusFormInput>
          name="education.vocationalTraining"
          label="Formation professionnelle"
          placeholder="Ex. Certificat en électricité bâtiment (2023)"
          optional
        />
        <TextAreaField<CensusFormInput>
          name="education.otherTraining"
          label="Autres formations"
          placeholder="Ateliers, formations en ligne, certifications…"
          optional
        />
      </div>
    </div>
  );
}
