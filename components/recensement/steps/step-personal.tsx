"use client";

import { Controller, useFormContext } from "react-hook-form";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { ChoiceCard } from "@/components/recensement/choice-card";
import { SelectField, StepIntro, TextField } from "@/components/recensement/fields";
import { GENDER_LABELS } from "@/lib/constants/referentials";
import type { CensusFormInput, AgeBounds } from "@/schemas/youth";
import type { QuartierOption } from "@/services/referentials.service";

interface Props {
  quartiers: QuartierOption[];
  bounds: AgeBounds;
}

function isoDateYearsAgo(years: number): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - years);
  return d.toISOString().slice(0, 10);
}

export function StepPersonal({ quartiers, bounds }: Props) {
  const { control, watch, formState } = useFormContext<CensusFormInput>();
  const quartierSlug = watch("personal.quartierSlug");
  const genderError = formState.errors.personal?.gender?.message;

  return (
    <div className="space-y-6">
      <StepIntro>
        Ces informations permettent de vous identifier de manière unique et de vous recontacter pour
        les opportunités correspondant à votre profil.
      </StepIntro>

      <div className="grid gap-5 sm:grid-cols-2">
        <TextField<CensusFormInput>
          name="personal.firstName"
          label="Prénom"
          autoComplete="given-name"
          autoCapitalize="words"
          placeholder="Ex. Aminata"
        />
        <TextField<CensusFormInput>
          name="personal.lastName"
          label="Nom"
          autoComplete="family-name"
          autoCapitalize="words"
          placeholder="Ex. Ndiaye"
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <TextField<CensusFormInput>
          name="personal.birthDate"
          label="Date de naissance"
          type="date"
          autoComplete="bday"
          min={isoDateYearsAgo(bounds.maxAge + 1)}
          max={isoDateYearsAgo(bounds.minAge)}
          description={`Recensement ouvert aux ${bounds.minAge}–${bounds.maxAge} ans.`}
        />

        <Field data-invalid={!!genderError}>
          <FieldLabel asChild>
            <span>Sexe</span>
          </FieldLabel>
          <Controller
            control={control}
            name="personal.gender"
            render={({ field }) => (
              <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Sexe">
                {(Object.keys(GENDER_LABELS) as (keyof typeof GENDER_LABELS)[]).map((g) => (
                  <ChoiceCard
                    key={g}
                    id={`gender-${g}`}
                    name={field.name}
                    type="radio"
                    value={g}
                    label={GENDER_LABELS[g]}
                    checked={field.value === g}
                    onChange={() => field.onChange(g)}
                  />
                ))}
              </div>
            )}
          />
          <FieldError>{genderError}</FieldError>
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <TextField<CensusFormInput>
          name="personal.phone"
          label="Numéro de téléphone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="77 123 45 67"
          description="Un seul recensement par numéro. Sénégal par défaut (+221)."
        />
        <TextField<CensusFormInput>
          name="personal.email"
          label="Adresse e-mail"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          placeholder="prenom.nom@exemple.com"
          optional
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <SelectField<CensusFormInput>
          name="personal.quartierSlug"
          label="Quartier / zone de résidence"
          placeholder="Choisir un quartier"
          options={quartiers.map((q) => ({ value: q.slug, label: q.name }))}
        />
        {quartierSlug === "autre" ? (
          <TextField<CensusFormInput>
            name="personal.quartierOther"
            label="Précisez votre quartier"
            placeholder="Nom du quartier ou de la zone"
            autoFocus
          />
        ) : null}
      </div>
    </div>
  );
}
