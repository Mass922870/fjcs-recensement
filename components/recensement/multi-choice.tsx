"use client";

import { Controller, useFormContext, type FieldPath } from "react-hook-form";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { ChoiceCard } from "@/components/recensement/choice-card";
import type { CensusFormInput } from "@/schemas/youth";

interface Option {
  slug: string;
  label: string;
  description?: string;
}

interface MultiChoiceProps {
  name: FieldPath<CensusFormInput>;
  label?: string;
  options: Option[];
  error?: string;
  columns?: 1 | 2 | 3;
}

/** Groupe de cases à cocher piloté par un tableau de slugs dans le formulaire. */
export function MultiChoice({ name, label, options, error, columns = 2 }: MultiChoiceProps) {
  const { control } = useFormContext<CensusFormInput>();
  const grid =
    columns === 3 ? "sm:grid-cols-2 lg:grid-cols-3" : columns === 2 ? "sm:grid-cols-2" : "";

  return (
    <Field data-invalid={!!error}>
      {label ? (
        <FieldLabel asChild>
          <span>{label}</span>
        </FieldLabel>
      ) : null}
      <Controller
        control={control}
        name={name}
        render={({ field }) => {
          const selected = (field.value as string[] | undefined) ?? [];
          const toggle = (slug: string, checked: boolean) => {
            const next = checked ? [...selected, slug] : selected.filter((s) => s !== slug);
            field.onChange(next);
          };
          return (
            <div className={`grid gap-3 ${grid}`}>
              {options.map((o) => (
                <ChoiceCard
                  key={o.slug}
                  id={`${name}-${o.slug}`}
                  name={name}
                  value={o.slug}
                  label={o.label}
                  description={o.description}
                  checked={selected.includes(o.slug)}
                  onChange={(c) => toggle(o.slug, c)}
                />
              ))}
            </div>
          );
        }}
      />
      <FieldError>{error}</FieldError>
    </Field>
  );
}
