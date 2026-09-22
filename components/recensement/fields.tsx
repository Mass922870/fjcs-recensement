"use client";

import * as React from "react";
import { Controller, get, useFormContext, type FieldPath, type FieldValues } from "react-hook-form";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function useFieldError<T extends FieldValues>(name: FieldPath<T>): string | undefined {
  const {
    formState: { errors },
  } = useFormContext<T>();
  const err = get(errors, name) as { message?: string } | undefined;
  return err?.message;
}

interface BaseProps<T extends FieldValues> {
  name: FieldPath<T>;
  label: string;
  description?: string;
  optional?: boolean;
  className?: string;
}

export function OptionalTag() {
  return <span className="text-muted-foreground text-xs font-normal">(facultatif)</span>;
}

export function TextField<T extends FieldValues>({
  name,
  label,
  description,
  optional,
  className,
  ...inputProps
}: BaseProps<T> & Omit<React.ComponentProps<typeof Input>, "name">) {
  const { register } = useFormContext<T>();
  const error = useFieldError<T>(name);
  const id = `f-${name}`;
  return (
    <Field data-invalid={!!error} className={className}>
      <FieldLabel htmlFor={id}>
        {label} {optional ? <OptionalTag /> : null}
      </FieldLabel>
      <Input
        id={id}
        aria-invalid={!!error}
        aria-describedby={description ? `${id}-desc` : undefined}
        {...inputProps}
        {...register(name)}
      />
      {description ? <FieldDescription id={`${id}-desc`}>{description}</FieldDescription> : null}
      <FieldError>{error}</FieldError>
    </Field>
  );
}

export function TextAreaField<T extends FieldValues>({
  name,
  label,
  description,
  optional,
  className,
  ...props
}: BaseProps<T> & Omit<React.ComponentProps<typeof Textarea>, "name">) {
  const { register } = useFormContext<T>();
  const error = useFieldError<T>(name);
  const id = `f-${name}`;
  return (
    <Field data-invalid={!!error} className={className}>
      <FieldLabel htmlFor={id}>
        {label} {optional ? <OptionalTag /> : null}
      </FieldLabel>
      <Textarea id={id} aria-invalid={!!error} rows={3} {...props} {...register(name)} />
      {description ? <FieldDescription>{description}</FieldDescription> : null}
      <FieldError>{error}</FieldError>
    </Field>
  );
}

export function SelectField<T extends FieldValues>({
  name,
  label,
  description,
  optional,
  className,
  placeholder = "Sélectionner…",
  options,
}: BaseProps<T> & {
  placeholder?: string;
  options: { value: string; label: string }[];
}) {
  const { control } = useFormContext<T>();
  const error = useFieldError<T>(name);
  const id = `f-${name}`;
  return (
    <Field data-invalid={!!error} className={className}>
      <FieldLabel htmlFor={id}>
        {label} {optional ? <OptionalTag /> : null}
      </FieldLabel>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <Select value={field.value ?? ""} onValueChange={field.onChange} name={field.name}>
            <SelectTrigger id={id} aria-invalid={!!error} onBlur={field.onBlur}>
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {options.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />
      {description ? <FieldDescription>{description}</FieldDescription> : null}
      <FieldError>{error}</FieldError>
    </Field>
  );
}

/** En-tête de section à l'intérieur d'une étape. */
export function StepIntro({ children }: { children: React.ReactNode }) {
  return <p className="text-muted-foreground text-[15px] leading-relaxed">{children}</p>;
}
