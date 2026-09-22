"use client";

import { Controller, useFormContext } from "react-hook-form";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { ChoiceCard } from "@/components/recensement/choice-card";
import { SelectField, StepIntro, TextField } from "@/components/recensement/fields";
import type { CensusFormInput } from "@/schemas/youth";
import type { EmploymentStatusOption, SimpleOption } from "@/services/referentials.service";

interface Props {
  statuses: EmploymentStatusOption[];
  sectors: SimpleOption[];
}

export function StepEmployment({ statuses, sectors }: Props) {
  const { control, watch, formState, setValue } = useFormContext<CensusFormInput>();
  const statusSlug = watch("employment.statusSlug");
  const current = statuses.find((s) => s.slug === statusSlug);
  const isEntrepreneur = current?.kind === "ENTREPRENEUR";
  const statusError = formState.errors.employment?.statusSlug?.message;

  return (
    <div className="space-y-6">
      <StepIntro>Quelle est votre situation principale aujourd'hui ?</StepIntro>

      <Field data-invalid={!!statusError}>
        <FieldLabel asChild>
          <span>Situation professionnelle</span>
        </FieldLabel>
        <Controller
          control={control}
          name="employment.statusSlug"
          render={({ field }) => (
            <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Situation">
              {statuses.map((s) => (
                <ChoiceCard
                  key={s.slug}
                  id={`status-${s.slug}`}
                  name={field.name}
                  type="radio"
                  value={s.slug}
                  label={s.label}
                  checked={field.value === s.slug}
                  onChange={() => {
                    field.onChange(s.slug);
                    if (s.kind === "ENTREPRENEUR") {
                      setValue("employment.project", {
                        sector: "",
                        name: "",
                        isFormalized: false,
                        sinceMonths: undefined,
                        teamSize: undefined,
                      });
                    } else {
                      setValue("employment.project", undefined);
                    }
                  }}
                />
              ))}
            </div>
          )}
        />
        <FieldError>{statusError}</FieldError>
      </Field>

      {current?.requiresDetail ? (
        <TextField<CensusFormInput>
          name="employment.otherDetail"
          label="Précisez votre situation"
          placeholder="Ex. En année de césure"
          autoFocus
        />
      ) : null}

      {isEntrepreneur ? (
        <fieldset className="space-y-5 rounded-2xl border border-brand-100 bg-brand-50/40 p-5">
          <legend className="px-1 text-sm font-semibold text-brand-800">
            Votre activité entrepreneuriale
          </legend>

          <SelectField<CensusFormInput>
            name="employment.project.sector"
            label="Domaine d'activité"
            placeholder="Choisir un domaine"
            options={sectors.map((s) => ({ value: s.label, label: s.label }))}
          />
          <TextField<CensusFormInput>
            name="employment.project.name"
            label="Nom de l'activité"
            placeholder="Ex. Dibiterie Chez Modou"
            optional
          />

          <Controller
            control={control}
            name="employment.project.isFormalized"
            render={({ field }) => (
              <Field>
                <FieldLabel asChild>
                  <span>Activité formalisée ?</span>
                </FieldLabel>
                <div className="grid grid-cols-2 gap-3" role="radiogroup">
                  <ChoiceCard
                    id="formalized-yes"
                    name={field.name}
                    type="radio"
                    label="Oui"
                    checked={field.value === true}
                    onChange={() => field.onChange(true)}
                  />
                  <ChoiceCard
                    id="formalized-no"
                    name={field.name}
                    type="radio"
                    label="Non"
                    checked={field.value === false}
                    onChange={() => field.onChange(false)}
                  />
                </div>
                <FieldDescription>
                  Formalisée = registre de commerce, NINEA… Cette information aide le FJCS à
                  orienter vers les dispositifs de formalisation.
                </FieldDescription>
              </Field>
            )}
          />

          <div className="grid gap-5 sm:grid-cols-2">
            <TextField<CensusFormInput>
              name="employment.project.sinceMonths"
              label="Depuis combien de mois ?"
              type="number"
              inputMode="numeric"
              min={0}
              placeholder="Ex. 18"
              optional
            />
            <TextField<CensusFormInput>
              name="employment.project.teamSize"
              label="Personnes impliquées"
              type="number"
              inputMode="numeric"
              min={1}
              placeholder="Ex. 3"
              description="Vous inclus, approximativement."
              optional
            />
          </div>
        </fieldset>
      ) : null}
    </div>
  );
}
