"use client";

import { useFormContext } from "react-hook-form";
import { MultiChoice } from "@/components/recensement/multi-choice";
import { StepIntro, TextField } from "@/components/recensement/fields";
import type { CensusFormInput } from "@/schemas/youth";
import type { SimpleOption, SkillOption } from "@/services/referentials.service";

export function StepSkills({ skills, categories }: { skills: SkillOption[]; categories: SimpleOption[] }) {
  const { formState, watch } = useFormContext<CensusFormInput>();
  const error = formState.errors.skills?.skillSlugs?.message;
  const count = watch("skills.skillSlugs")?.length ?? 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <StepIntro>
          Sélectionnez toutes les compétences que vous possédez, même en cours d'acquisition.
        </StepIntro>
        <span className="bg-muted text-muted-foreground w-fit shrink-0 rounded-full px-2.5 py-1 text-xs font-medium tabular-nums">
          {count} sélectionnée{count > 1 ? "s" : ""}
        </span>
      </div>

      {error ? (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      ) : null}

      {categories.map((cat) => {
        const options = skills.filter((s) => s.categorySlug === cat.slug);
        if (!options.length) return null;
        return (
          <section key={cat.slug} className="space-y-3">
            <h2 className="text-foreground text-sm font-semibold tracking-wide uppercase">
              {cat.label}
            </h2>
            <MultiChoice name="skills.skillSlugs" options={options} columns={3} />
          </section>
        );
      })}

      <TextField<CensusFormInput>
        name="skills.customSkills"
        label="Autre compétence"
        placeholder="Ex. Soudure, traduction wolof-français…"
        optional
      />
    </div>
  );
}
