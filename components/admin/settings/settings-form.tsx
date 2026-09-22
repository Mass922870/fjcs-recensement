"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { saveSettingsAction } from "@/actions/settings";
import type { SettingsInput } from "@/schemas/settings";

export function SettingsForm({ initial }: { initial: SettingsInput }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>({});

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        setErrors({});
        start(async () => {
          const res = await saveSettingsAction({
            minAge: fd.get("minAge"),
            maxAge: fd.get("maxAge"),
            formOpen: initial.formOpen,
            retentionMonths: fd.get("retentionMonths"),
            contactEmail: fd.get("contactEmail"),
            contactPhone: fd.get("contactPhone"),
            contactAddress: fd.get("contactAddress"),
          });
          if (res.ok) {
            toast.success("Paramètres enregistrés.");
            router.refresh();
          } else {
            setErrors(res.fieldErrors ?? {});
            toast.error(res.error);
          }
        });
      }}
    >
      <section className="border-border space-y-4 rounded-2xl border bg-white p-5">
        <h2 className="text-foreground text-sm font-semibold">Tranche d'âge du recensement</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field data-invalid={!!errors.minAge}>
            <FieldLabel htmlFor="minAge">Âge minimal</FieldLabel>
            <Input
              id="minAge"
              name="minAge"
              type="number"
              min={10}
              max={40}
              defaultValue={initial.minAge}
              required
            />
            <FieldError>{errors.minAge?.[0]}</FieldError>
          </Field>
          <Field data-invalid={!!errors.maxAge}>
            <FieldLabel htmlFor="maxAge">Âge maximal</FieldLabel>
            <Input
              id="maxAge"
              name="maxAge"
              type="number"
              min={15}
              max={60}
              defaultValue={initial.maxAge}
              required
            />
            <FieldError>{errors.maxAge?.[0]}</FieldError>
          </Field>
        </div>
      </section>

      <section className="border-border space-y-4 rounded-2xl border bg-white p-5">
        <h2 className="text-foreground text-sm font-semibold">Protection des données</h2>
        <Field data-invalid={!!errors.retentionMonths}>
          <FieldLabel htmlFor="retentionMonths">Durée de conservation (mois)</FieldLabel>
          <Input
            id="retentionMonths"
            name="retentionMonths"
            type="number"
            min={6}
            max={120}
            defaultValue={initial.retentionMonths}
            required
            className="sm:w-40"
          />
          <FieldDescription>
            Au-delà, les profils sont anonymisés (voir le bloc « Politique de conservation »).
            Valeur publiée dans la politique de confidentialité.
          </FieldDescription>
          <FieldError>{errors.retentionMonths?.[0]}</FieldError>
        </Field>
      </section>

      <section className="border-border space-y-4 rounded-2xl border bg-white p-5">
        <h2 className="text-foreground text-sm font-semibold">Coordonnées du FJCS</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field data-invalid={!!errors.contactEmail}>
            <FieldLabel htmlFor="contactEmail">E-mail de contact</FieldLabel>
            <Input
              id="contactEmail"
              name="contactEmail"
              type="email"
              defaultValue={initial.contactEmail}
              required
            />
            <FieldError>{errors.contactEmail?.[0]}</FieldError>
          </Field>
          <Field data-invalid={!!errors.contactPhone}>
            <FieldLabel htmlFor="contactPhone">Téléphone</FieldLabel>
            <Input
              id="contactPhone"
              name="contactPhone"
              type="tel"
              defaultValue={initial.contactPhone ?? ""}
            />
            <FieldError>{errors.contactPhone?.[0]}</FieldError>
          </Field>
        </div>
        <Field data-invalid={!!errors.contactAddress}>
          <FieldLabel htmlFor="contactAddress">Adresse</FieldLabel>
          <Input
            id="contactAddress"
            name="contactAddress"
            defaultValue={initial.contactAddress}
            required
          />
          <FieldError>{errors.contactAddress?.[0]}</FieldError>
        </Field>
      </section>

      <div className="flex justify-end">
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
  );
}
