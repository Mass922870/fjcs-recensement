"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FormProvider, useForm, type FieldPath } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, History, Loader2, RotateCcw, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Stepper } from "@/components/recensement/stepper";
import { StepPersonal } from "@/components/recensement/steps/step-personal";
import { StepEducation } from "@/components/recensement/steps/step-education";
import { StepEmployment } from "@/components/recensement/steps/step-employment";
import { StepSkills } from "@/components/recensement/steps/step-skills";
import { StepNeeds } from "@/components/recensement/steps/step-needs";
import { StepInterests } from "@/components/recensement/steps/step-interests";
import { StepSummary } from "@/components/recensement/steps/step-summary";
import { Turnstile } from "@/components/recensement/turnstile";
import { useCensusDraft } from "@/hooks/use-census-draft";
import { clearCensusDraft, writeCensusDraft } from "@/lib/census-draft";
import { submitCensus } from "@/actions/census";
import {
  CENSUS_DEFAULT_VALUES,
  CENSUS_STEPS,
  CENSUS_STEP_KEYS,
  createCensusSchema,
  type AgeBounds,
  type CensusFormInput,
  type CensusFormOutput,
} from "@/schemas/youth";
import type { FormReferentials } from "@/services/referentials.service";
import { rulesFromReferentials } from "@/lib/census-rules";

interface CensusFormProps {
  referentials: FormReferentials;
  bounds: AgeBounds;
  turnstileSiteKey?: string;
}

const LAST_STEP = CENSUS_STEPS.length - 1;

export function CensusForm({ referentials, bounds, turnstileSiteKey }: CensusFormProps) {
  const router = useRouter();
  const draft = useCensusDraft();
  const [step, setStep] = useState(0);
  const [maxReached, setMaxReached] = useState(0);
  const [draftDismissed, setDraftDismissed] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | undefined>();
  const [isPending, startTransition] = useTransition();
  const [startedAt, setStartedAt] = useState<number>(() => Date.now());
  const [navigated, setNavigated] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const form = useForm<CensusFormInput, unknown, CensusFormOutput>({
    resolver: zodResolver(createCensusSchema(bounds, rulesFromReferentials(referentials))),
    defaultValues: CENSUS_DEFAULT_VALUES,
    mode: "onTouched",
    shouldFocusError: true,
  });

  // Sauvegarde locale du brouillon à chaque modification (debounce léger).
  useEffect(() => {
    let timer: number | undefined;
    const unsubscribe = form.subscribe({
      formState: { values: true },
      callback: ({ values }) => {
        window.clearTimeout(timer);
        timer = window.setTimeout(() => {
          writeCensusDraft({ step, startedAt, values: values as CensusFormInput });
        }, 400);
      },
    });
    return () => {
      unsubscribe();
      window.clearTimeout(timer);
    };
  }, [form, step, startedAt]);

  // Défilement + focus intelligent à chaque changement d'étape (pas au premier rendu).
  useEffect(() => {
    if (!navigated) return;
    const el = containerRef.current;
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    const focusable = el.querySelector<HTMLElement>(
      'input:not([type="hidden"]):not(.sr-only), [role="combobox"], textarea, button[type="button"]:not([data-nav])',
    );
    window.setTimeout(() => focusable?.focus({ preventScroll: true }), 250);
  }, [step, navigated]);

  const goTo = useCallback((index: number) => {
    setNavigated(true);
    setStep(index);
    setMaxReached((m) => Math.max(m, index));
    setServerError(null);
  }, []);

  const validateCurrentStep = useCallback(async () => {
    const key = CENSUS_STEP_KEYS[step]!;
    return form.trigger(key as FieldPath<CensusFormInput>, { shouldFocus: true });
  }, [form, step]);

  const next = async () => {
    if (await validateCurrentStep()) goTo(Math.min(step + 1, LAST_STEP));
  };

  const prev = () => goTo(Math.max(step - 1, 0));

  const resumeDraft = () => {
    if (!draft) return;
    form.reset(draft.values);
    setStartedAt(draft.startedAt);
    setNavigated(true);
    setStep(Math.min(draft.step, LAST_STEP));
    setMaxReached(Math.min(draft.step, LAST_STEP));
    setDraftDismissed(true);
    toast.success("Votre progression a été restaurée.");
  };

  const discardDraft = () => {
    clearCensusDraft();
    setDraftDismissed(true);
  };

  const onSubmit = form.handleSubmit(() => {
    setServerError(null);
    startTransition(async () => {
      const result = await submitCensus(form.getValues(), {
        website: (document.getElementById("website") as HTMLInputElement | null)?.value ?? "",
        startedAt,
        turnstileToken,
      });

      if (result.ok) {
        clearCensusDraft();
        router.push(`/confirmation?code=${encodeURIComponent(result.participationCode)}`);
        return;
      }

      if (result.code === "DUPLICATE") {
        form.setError("personal.phone", { type: "server", message: result.message });
        goTo(0);
        return;
      }
      if (result.code === "VALIDATION" && result.fieldErrors) {
        for (const [path, messages] of Object.entries(result.fieldErrors)) {
          form.setError(path as FieldPath<CensusFormInput>, {
            type: "server",
            message: messages[0],
          });
        }
      }
      setServerError(result.message);
    });
  });

  const showResume = draft && !draftDismissed && !navigated && draft.step > 0;

  return (
    <FormProvider {...form}>
      <div ref={containerRef} className="form-public scroll-mt-24 space-y-8">
        <Stepper current={step} maxReached={maxReached} onSelect={goTo} />

        {showResume ? (
          <Alert className="border-cyan-200 bg-cyan-50/60">
            <History className="text-cyan-700" />
            <AlertTitle>Reprendre votre inscription ?</AlertTitle>
            <AlertDescription className="space-y-3">
              <p>Un brouillon enregistré sur cet appareil a été trouvé (étape {draft.step + 1}).</p>
              <div className="flex flex-wrap gap-2">
                <Button type="button" size="sm" onClick={resumeDraft}>
                  Reprendre
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={discardDraft}>
                  <RotateCcw data-icon="inline-start" />
                  Recommencer
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        ) : null}

        <form onSubmit={onSubmit} noValidate className="space-y-8">
          {/* Honeypot : invisible pour les humains, rempli par les bots. */}
          <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
            <label htmlFor="website">Site web</label>
            <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
          </div>

          <div className="border-border rounded-3xl border bg-white p-5 shadow-[0_20px_60px_-40px_rgba(26,13,144,0.35)] sm:p-8">
            {step === 0 ? (
              <StepPersonal quartiers={referentials.quartiers} bounds={bounds} />
            ) : null}
            {step === 1 ? <StepEducation levels={referentials.educationLevels} /> : null}
            {step === 2 ? <StepEmployment statuses={referentials.employmentStatuses} sectors={referentials.sectors} /> : null}
            {step === 3 ? <StepSkills skills={referentials.skills} categories={referentials.skillCategories} /> : null}
            {step === 4 ? <StepNeeds needs={referentials.needs} /> : null}
            {step === 5 ? <StepInterests interests={referentials.interests} /> : null}
            {step === 6 ? <StepSummary referentials={referentials} onEdit={goTo} /> : null}
          </div>

          {step === LAST_STEP && turnstileSiteKey ? (
            <Turnstile siteKey={turnstileSiteKey} onToken={setTurnstileToken} />
          ) : null}

          {serverError ? (
            <Alert variant="destructive">
              <AlertTitle>Envoi impossible</AlertTitle>
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          ) : null}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button
              type="button"
              variant="outline"
              size="lg"
              data-nav
              onClick={prev}
              disabled={step === 0 || isPending}
              className="h-12 sm:h-11"
            >
              <ArrowLeft data-icon="inline-start" />
              Précédent
            </Button>

            {step < LAST_STEP ? (
              <Button type="button" size="lg" data-nav onClick={next} className="h-12 px-6 sm:h-11">
                Suivant
                <ArrowRight data-icon="inline-end" />
              </Button>
            ) : (
              <Button
                type="submit"
                size="lg"
                data-nav
                disabled={isPending || (!!turnstileSiteKey && !turnstileToken)}
                className="h-12 px-6 sm:h-11"
              >
                {isPending ? (
                  <Loader2 data-icon="inline-start" className="animate-spin" />
                ) : (
                  <Send data-icon="inline-start" />
                )}
                {isPending ? "Envoi en cours…" : "Valider mon inscription"}
              </Button>
            )}
          </div>
        </form>
      </div>
    </FormProvider>
  );
}
