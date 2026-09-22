"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FormProvider, useForm, type FieldPath } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { StepPersonal } from "@/components/recensement/steps/step-personal";
import { StepEducation } from "@/components/recensement/steps/step-education";
import { StepEmployment } from "@/components/recensement/steps/step-employment";
import { StepSkills } from "@/components/recensement/steps/step-skills";
import { StepNeeds } from "@/components/recensement/steps/step-needs";
import { StepInterests } from "@/components/recensement/steps/step-interests";
import { updateYouthAction } from "@/actions/youth";
import {
  createCensusSchema,
  type AgeBounds,
  type CensusFormInput,
  type CensusFormOutput,
} from "@/schemas/youth";
import type { FormReferentials } from "@/services/referentials.service";
import { rulesFromReferentials } from "@/lib/census-rules";

interface Props {
  id: string;
  initialValues: CensusFormInput;
  referentials: FormReferentials;
  bounds: AgeBounds;
}

const TABS = [
  { value: "personal", label: "Identité" },
  { value: "education", label: "Formation" },
  { value: "employment", label: "Situation" },
  { value: "skills", label: "Compétences" },
  { value: "needs", label: "Besoins" },
  { value: "interests", label: "Intérêts" },
] as const;

/** Édition admin d'une fiche : réutilise les étapes du formulaire public, en onglets. */
export function YouthEditForm({ id, initialValues, referentials, bounds }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [tab, setTab] = useState<string>("personal");

  const form = useForm<CensusFormInput, unknown, CensusFormOutput>({
    resolver: zodResolver(createCensusSchema(bounds, rulesFromReferentials(referentials))),
    defaultValues: initialValues,
    mode: "onTouched",
  });

  const onSubmit = form.handleSubmit(
    () => {
      setServerError(null);
      startTransition(async () => {
        const res = await updateYouthAction(id, form.getValues());
        if (res.ok) {
          toast.success("Fiche mise à jour.");
          router.push(`/admin/jeunes/${id}`);
          router.refresh();
          return;
        }
        if (res.fieldErrors) {
          for (const [path, msgs] of Object.entries(res.fieldErrors)) {
            form.setError(path as FieldPath<CensusFormInput>, { type: "server", message: msgs[0] });
          }
        }
        if (res.code === "DUPLICATE_PHONE") {
          form.setError("personal.phone", { type: "server", message: res.error });
          setTab("personal");
        }
        setServerError(res.error);
      });
    },
    (errors) => {
      // Ouvre l'onglet contenant la première erreur.
      const first = Object.keys(errors)[0];
      if (first && TABS.some((t) => t.value === first)) setTab(first);
      toast.error("Certains champs sont invalides.");
    },
  );

  return (
    <FormProvider {...form}>
      <form onSubmit={onSubmit} noValidate className="form-public space-y-6">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="flex h-auto w-full flex-wrap justify-start">
            {TABS.map((t) => (
              <TabsTrigger key={t.value} value={t.value} className="data-[state=active]:bg-white">
                {t.label}
                {form.formState.errors[t.value] ? (
                  <span className="bg-destructive ml-1 size-1.5 rounded-full" />
                ) : null}
              </TabsTrigger>
            ))}
          </TabsList>
          <div className="border-border mt-4 rounded-2xl border bg-white p-5 sm:p-6">
            <TabsContent value="personal" forceMount className="data-[state=inactive]:hidden">
              <StepPersonal quartiers={referentials.quartiers} bounds={bounds} />
            </TabsContent>
            <TabsContent value="education" forceMount className="data-[state=inactive]:hidden">
              <StepEducation levels={referentials.educationLevels} />
            </TabsContent>
            <TabsContent value="employment" forceMount className="data-[state=inactive]:hidden">
              <StepEmployment statuses={referentials.employmentStatuses} sectors={referentials.sectors} />
            </TabsContent>
            <TabsContent value="skills" forceMount className="data-[state=inactive]:hidden">
              <StepSkills skills={referentials.skills} categories={referentials.skillCategories} />
            </TabsContent>
            <TabsContent value="needs" forceMount className="data-[state=inactive]:hidden">
              <StepNeeds needs={referentials.needs} />
            </TabsContent>
            <TabsContent value="interests" forceMount className="data-[state=inactive]:hidden">
              <StepInterests interests={referentials.interests} />
            </TabsContent>
          </div>
        </Tabs>

        {serverError ? (
          <Alert variant="destructive">
            <AlertDescription>{serverError}</AlertDescription>
          </Alert>
        ) : null}

        <div className="flex items-center justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={pending}>
            Annuler
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? (
              <Loader2 data-icon="inline-start" className="animate-spin" />
            ) : (
              <Save data-icon="inline-start" />
            )}
            Enregistrer
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
