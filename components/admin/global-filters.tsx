"use client";

import { useCallback, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Loader2, RotateCcw, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AGE_BRACKETS, GENDER_LABELS } from "@/lib/constants/referentials";
import { STATS_FILTER_KEYS, countActiveFilters, type StatsFilters } from "@/schemas/filters";
import type { FormReferentials } from "@/services/referentials.service";

const ALL = "__all__";

interface GlobalFiltersProps {
  filters: StatsFilters;
  referentials: FormReferentials;
  /** Filtres à afficher (par défaut : période, sexe, âge, quartier, niveau, situation). */
  show?: (keyof StatsFilters)[];
}

const DEFAULT_SHOW: (keyof StatsFilters)[] = [
  "from",
  "to",
  "gender",
  "age",
  "quartier",
  "education",
  "employment",
];

/**
 * Barre de filtres globaux : l'état vit dans l'URL (partageable, rechargeable),
 * chaque changement re-rend les composants serveur avec les nouvelles données.
 */
export function GlobalFilters({ filters, referentials, show = DEFAULT_SHOW }: GlobalFiltersProps) {
  const { quartiers, skills, needs, educationLevels, employmentStatuses } = referentials;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const active = countActiveFilters(filters);

  const update = useCallback(
    (patch: Partial<Record<keyof StatsFilters, string | undefined>>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [k, v] of Object.entries(patch)) {
        if (!v || v === ALL) params.delete(k);
        else params.set(k, v);
      }
      params.delete("page");
      startTransition(() => {
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
      });
    },
    [router, pathname, searchParams],
  );

  const reset = () => {
    const params = new URLSearchParams(searchParams.toString());
    for (const k of STATS_FILTER_KEYS) params.delete(k);
    params.delete("page");
    startTransition(() => router.replace(`${pathname}?${params.toString()}`, { scroll: false }));
  };

  const has = (k: keyof StatsFilters) => show.includes(k);

  return (
    <div className="border-border mb-6 rounded-2xl border bg-white p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-foreground flex items-center gap-2 text-sm font-medium">
          <SlidersHorizontal className="text-muted-foreground size-4" />
          Filtres
          {active > 0 ? (
            <span className="bg-brand-50 text-brand-700 rounded-full px-2 py-0.5 text-xs font-medium">
              {active} actif{active > 1 ? "s" : ""}
            </span>
          ) : null}
          {pending ? <Loader2 className="text-muted-foreground size-4 animate-spin" /> : null}
        </p>
        {active > 0 ? (
          <Button type="button" variant="ghost" size="sm" onClick={reset}>
            <RotateCcw data-icon="inline-start" />
            Réinitialiser
          </Button>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        {has("from") ? (
          <FilterField label="Du">
            <Input
              type="date"
              value={filters.from ?? ""}
              onChange={(e) => update({ from: e.target.value })}
              className="h-9"
            />
          </FilterField>
        ) : null}
        {has("to") ? (
          <FilterField label="Au">
            <Input
              type="date"
              value={filters.to ?? ""}
              onChange={(e) => update({ to: e.target.value })}
              className="h-9"
            />
          </FilterField>
        ) : null}
        {has("gender") ? (
          <FilterSelect
            label="Sexe"
            value={filters.gender}
            onChange={(v) => update({ gender: v })}
            options={Object.entries(GENDER_LABELS).map(([value, label]) => ({ value, label }))}
          />
        ) : null}
        {has("age") ? (
          <FilterSelect
            label="Tranche d'âge"
            value={filters.age}
            onChange={(v) => update({ age: v })}
            options={AGE_BRACKETS.map((b) => ({ value: b.key, label: b.label }))}
          />
        ) : null}
        {has("quartier") ? (
          <FilterSelect
            label="Quartier"
            value={filters.quartier}
            onChange={(v) => update({ quartier: v })}
            options={quartiers.map((q) => ({ value: q.slug, label: q.name }))}
          />
        ) : null}
        {has("education") ? (
          <FilterSelect
            label="Niveau d'études"
            value={filters.education}
            onChange={(v) => update({ education: v })}
            options={educationLevels.map((l) => ({ value: l.slug, label: l.label }))}
          />
        ) : null}
        {has("employment") ? (
          <FilterSelect
            label="Situation"
            value={filters.employment}
            onChange={(v) => update({ employment: v })}
            options={employmentStatuses.map((s) => ({ value: s.slug, label: s.label }))}
          />
        ) : null}
        {has("skill") ? (
          <FilterSelect
            label="Compétence"
            value={filters.skill}
            onChange={(v) => update({ skill: v })}
            options={skills.map((s) => ({ value: s.slug, label: s.label }))}
          />
        ) : null}
        {has("need") ? (
          <FilterSelect
            label="Besoin"
            value={filters.need}
            onChange={(v) => update({ need: v })}
            options={needs.map((n) => ({ value: n.slug, label: n.label }))}
          />
        ) : null}
      </div>
    </div>
  );
}

function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-muted-foreground text-xs">{label}</Label>
      {children}
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value?: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <FilterField label={label}>
      <Select value={value ?? ALL} onValueChange={onChange}>
        <SelectTrigger className="h-9 w-full" aria-label={label}>
          <SelectValue placeholder="Tous" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Tous</SelectItem>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FilterField>
  );
}
