"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChoiceCardProps {
  id: string;
  name: string;
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  type?: "checkbox" | "radio";
  value?: string;
  className?: string;
}

/**
 * Carte de sélection accessible (input natif masqué visuellement) - utilisée
 * pour les choix uniques (radio) et multiples (checkbox) du formulaire.
 */
export function ChoiceCard({
  id,
  name,
  label,
  description,
  checked,
  onChange,
  type = "checkbox",
  value,
  className,
}: ChoiceCardProps) {
  return (
    <label
      htmlFor={id}
      className={cn(
        "group relative flex cursor-pointer items-start gap-3 rounded-xl border bg-white p-3.5 text-left transition-colors select-none",
        "has-[:focus-visible]:ring-ring/50 has-[:focus-visible]:ring-3",
        checked
          ? "border-brand-600 bg-brand-50/70"
          : "border-border hover:border-brand-200 hover:bg-muted/40",
        className,
      )}
    >
      <input
        id={id}
        name={name}
        type={type}
        value={value}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="peer sr-only"
      />
      <span
        aria-hidden
        className={cn(
          "mt-0.5 flex size-5 shrink-0 items-center justify-center border transition-colors",
          type === "radio" ? "rounded-full" : "rounded-md",
          checked ? "border-brand-700 bg-brand-700 text-white" : "border-input bg-white",
        )}
      >
        {checked ? (
          type === "radio" ? (
            <span className="size-2 rounded-full bg-white" />
          ) : (
            <Check className="size-3.5" strokeWidth={3} />
          )
        ) : null}
      </span>
      <span className="min-w-0 flex-1">
        <span className="text-foreground block text-[15px] leading-snug font-medium">{label}</span>
        {description ? (
          <span className="text-muted-foreground mt-0.5 block text-sm leading-snug">
            {description}
          </span>
        ) : null}
      </span>
    </label>
  );
}
