"use client";

import { useState, useTransition } from "react";
import { Loader2, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { changeOwnPasswordAction } from "@/actions/users";

export function PasswordForm() {
  const [pending, start] = useTransition();
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>({});

  return (
    <form
      className="border-border space-y-4 rounded-2xl border bg-white p-5"
      onSubmit={(e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const fd = new FormData(form);
        setErrors({});
        start(async () => {
          const res = await changeOwnPasswordAction({
            currentPassword: fd.get("currentPassword"),
            newPassword: fd.get("newPassword"),
            confirm: fd.get("confirm"),
          });
          if (res.ok) {
            toast.success("Mot de passe modifié.");
            form.reset();
          } else {
            setErrors(res.fieldErrors ?? {});
            toast.error(res.error);
          }
        });
      }}
    >
      <h2 className="text-foreground text-sm font-semibold">Mon mot de passe</h2>
      <Field data-invalid={!!errors.currentPassword}>
        <FieldLabel htmlFor="currentPassword">Mot de passe actuel</FieldLabel>
        <Input
          id="currentPassword"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          required
        />
        <FieldError>{errors.currentPassword?.[0]}</FieldError>
      </Field>
      <Field data-invalid={!!errors.newPassword}>
        <FieldLabel htmlFor="newPassword">Nouveau mot de passe</FieldLabel>
        <Input
          id="newPassword"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          required
        />
        <FieldError>{errors.newPassword?.[0]}</FieldError>
      </Field>
      <Field data-invalid={!!errors.confirm}>
        <FieldLabel htmlFor="confirm">Confirmation</FieldLabel>
        <Input id="confirm" name="confirm" type="password" autoComplete="new-password" required />
        <FieldError>{errors.confirm?.[0]}</FieldError>
      </Field>
      <Button type="submit" variant="outline" disabled={pending}>
        {pending ? (
          <Loader2 data-icon="inline-start" className="animate-spin" />
        ) : (
          <KeyRound data-icon="inline-start" />
        )}
        Modifier
      </Button>
    </form>
  );
}
