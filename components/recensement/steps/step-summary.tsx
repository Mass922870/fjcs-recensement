"use client";

import Link from "next/link";
import { Controller, useFormContext } from "react-hook-form";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldError } from "@/components/ui/field";
import { StepIntro } from "@/components/recensement/fields";
import { CONSENT_TEXT } from "@/lib/constants/app";
import { GENDER_LABELS } from "@/lib/constants/referentials";
import { CENSUS_STEPS, type CensusFormInput } from "@/schemas/youth";
import type { FormReferentials } from "@/services/referentials.service";

interface Props {
  referentials: FormReferentials;
  onEdit: (stepIndex: number) => void;
}

function formatDate(iso: string): string {
  if (!iso) return "-";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString("fr-FR", { dateStyle: "long" });
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="grid gap-0.5 py-2 sm:grid-cols-[180px_1fr] sm:gap-4">
      <dt className="text-muted-foreground text-sm">{label}</dt>
      <dd className="text-foreground text-[15px]">
        {value || <span className="text-muted-foreground">-</span>}
      </dd>
    </div>
  );
}

function Section({
  index,
  onEdit,
  children,
}: {
  index: number;
  onEdit: (i: number) => void;
  children: React.ReactNode;
}) {
  return (
    <section className="border-border rounded-2xl border bg-white">
      <header className="border-border flex items-center justify-between border-b px-5 py-3">
        <h2 className="text-foreground text-sm font-semibold">{CENSUS_STEPS[index]!.title}</h2>
        <Button type="button" variant="ghost" size="sm" onClick={() => onEdit(index)}>
          <Pencil data-icon="inline-start" />
          Modifier
        </Button>
      </header>
      <dl className="divide-border/70 divide-y px-5 py-1">{children}</dl>
    </section>
  );
}

export function StepSummary({ referentials, onEdit }: Props) {
  const { getValues, control, formState } = useFormContext<CensusFormInput>();
  const v = getValues();
  const consentError = formState.errors.consent?.consent?.message;

  const quartier = referentials.quartiers.find((q) => q.slug === v.personal.quartierSlug);
  const skillLabels = referentials.skills
    .filter((s) => v.skills.skillSlugs.includes(s.slug))
    .map((s) => s.label);
  const needLabels = referentials.needs
    .filter((n) => v.needs.needSlugs.includes(n.slug))
    .map((n) => n.label);
  const interestLabels = referentials.interests
    .filter((i) => v.interests.interestSlugs.includes(i.slug))
    .map((i) => i.label);
  const level = referentials.educationLevels.find((l) => l.slug === v.education.levelSlug);
  const status = referentials.employmentStatuses.find((s) => s.slug === v.employment.statusSlug);

  return (
    <div className="space-y-6">
      <StepIntro>
        Vérifiez vos réponses. Vous pouvez modifier chaque section avant de valider.
      </StepIntro>

      <div className="space-y-4">
        <Section index={0} onEdit={onEdit}>
          <Row
            label="Nom complet"
            value={`${v.personal.firstName} ${v.personal.lastName}`.trim()}
          />
          <Row label="Date de naissance" value={formatDate(v.personal.birthDate)} />
          <Row label="Sexe" value={v.personal.gender ? GENDER_LABELS[v.personal.gender] : ""} />
          <Row label="Téléphone" value={v.personal.phone} />
          <Row label="E-mail" value={v.personal.email} />
          <Row
            label="Quartier"
            value={v.personal.quartierSlug === "autre" ? v.personal.quartierOther : quartier?.name}
          />
        </Section>

        <Section index={1} onEdit={onEdit}>
          <Row
            label="Niveau d'études"
            value={level?.label ?? ""}
          />
          <Row label="Domaine" value={v.education.field} />
          <Row label="Établissement" value={v.education.institution} />
          <Row label="Diplôme" value={v.education.diploma} />
          <Row label="Formation pro." value={v.education.vocationalTraining} />
          <Row label="Autres formations" value={v.education.otherTraining} />
        </Section>

        <Section index={2} onEdit={onEdit}>
          <Row
            label="Situation"
            value={
              status
                ? status.requiresDetail && v.employment.otherDetail
                  ? `${status.label} - ${v.employment.otherDetail}`
                  : status.label
                : ""
            }
          />
          {status?.kind === "ENTREPRENEUR" && v.employment.project ? (
            <>
              <Row label="Domaine d'activité" value={v.employment.project.sector} />
              <Row label="Nom de l'activité" value={v.employment.project.name} />
              <Row label="Formalisée" value={v.employment.project.isFormalized ? "Oui" : "Non"} />
              <Row
                label="Ancienneté"
                value={
                  v.employment.project.sinceMonths !== undefined &&
                  v.employment.project.sinceMonths !== null &&
                  String(v.employment.project.sinceMonths) !== ""
                    ? `${v.employment.project.sinceMonths} mois`
                    : ""
                }
              />
              <Row
                label="Personnes impliquées"
                value={
                  v.employment.project.teamSize !== undefined &&
                  v.employment.project.teamSize !== null &&
                  String(v.employment.project.teamSize) !== ""
                    ? String(v.employment.project.teamSize)
                    : ""
                }
              />
            </>
          ) : null}
        </Section>

        <Section index={3} onEdit={onEdit}>
          <Row label="Compétences" value={skillLabels.join(", ")} />
          <Row label="Autre compétence" value={v.skills.customSkills} />
        </Section>

        <Section index={4} onEdit={onEdit}>
          <Row label="Besoins" value={needLabels.join(", ")} />
        </Section>

        <Section index={5} onEdit={onEdit}>
          <Row label="Centres d'intérêt" value={interestLabels.join(", ")} />
          <Row label="Autre" value={v.interests.customInterests} />
        </Section>
      </div>

      <Field
        data-invalid={!!consentError}
        className="border-brand-100 bg-brand-50/40 rounded-2xl border p-5"
      >
        <Controller
          control={control}
          name="consent.consent"
          render={({ field }) => (
            <label htmlFor="consent" className="flex cursor-pointer items-start gap-3">
              <Checkbox
                id="consent"
                checked={field.value === true}
                onCheckedChange={(c) => field.onChange(c === true ? true : undefined)}
                aria-invalid={!!consentError}
                className="mt-0.5 size-5"
              />
              <span className="text-foreground text-[15px] leading-relaxed">
                {CONSENT_TEXT}{" "}
                <Link
                  href="/confidentialite"
                  target="_blank"
                  className="text-primary font-medium underline-offset-4 hover:underline"
                >
                  Lire la politique de confidentialité
                </Link>
                .
              </span>
            </label>
          )}
        />
        <FieldError className="pl-8">{consentError}</FieldError>
      </Field>
    </div>
  );
}
