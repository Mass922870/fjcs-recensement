"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Download, FileSpreadsheet, FileText, Lock, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { STATS_FILTER_KEYS } from "@/schemas/filters";
import { cn } from "@/lib/utils";

interface Props {
  canExportPersonal: boolean;
  matching: number;
}

const nf = new Intl.NumberFormat("fr-FR");

export function ExportPanel({ canExportPersonal, matching }: Props) {
  const sp = useSearchParams();
  const [scope, setScope] = useState<"anonymous" | "personal">("anonymous");
  const [fmt, setFmt] = useState<"csv" | "xlsx">("xlsx");

  const href = () => {
    const params = new URLSearchParams();
    for (const k of STATS_FILTER_KEYS) {
      const v = sp.get(k);
      if (v) params.set(k, v);
    }
    params.set("format", fmt);
    params.set("scope", scope);
    return `/api/exports?${params.toString()}`;
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <div className="border-border space-y-6 rounded-2xl border bg-white p-5">
        <fieldset className="space-y-3">
          <legend className="text-foreground text-sm font-semibold">Périmètre des données</legend>
          <RadioGroup
            value={scope}
            onValueChange={(v) => setScope(v as "anonymous" | "personal")}
            className="grid gap-3 sm:grid-cols-2"
          >
            <ScopeCard
              value="anonymous"
              checked={scope === "anonymous"}
              icon={ShieldCheck}
              title="Données anonymisées"
              text="Identifiant, âge, sexe, quartier, formation, situation, compétences, besoins. Aucune donnée de contact."
            />
            <ScopeCard
              value="personal"
              checked={scope === "personal"}
              icon={Lock}
              title="Données nominatives"
              text="Ajoute nom, prénom, date de naissance, téléphone et e-mail. Réservé aux administrateurs, journalisé."
              disabled={!canExportPersonal}
            />
          </RadioGroup>
        </fieldset>

        <fieldset className="space-y-3">
          <legend className="text-foreground text-sm font-semibold">Format</legend>
          <RadioGroup
            value={fmt}
            onValueChange={(v) => setFmt(v as "csv" | "xlsx")}
            className="grid gap-3 sm:grid-cols-2"
          >
            <ScopeCard
              value="xlsx"
              checked={fmt === "xlsx"}
              icon={FileSpreadsheet}
              title="Excel (.xlsx)"
              text="Feuille formatée, filtres automatiques, onglet d'informations."
            />
            <ScopeCard
              value="csv"
              checked={fmt === "csv"}
              icon={FileText}
              title="CSV (.csv)"
              text="UTF-8, séparateur « ; », compatible tous tableurs et outils d'analyse."
            />
          </RadioGroup>
        </fieldset>
      </div>

      <aside className="border-border flex flex-col justify-between rounded-2xl border bg-white p-5">
        <div className="space-y-2">
          <p className="text-foreground text-sm font-semibold">Résumé</p>
          <p className="text-foreground text-3xl font-semibold">{nf.format(matching)}</p>
          <p className="text-muted-foreground text-sm">
            profil{matching > 1 ? "s" : ""} correspond{matching > 1 ? "ent" : ""} aux filtres
            actuels.
          </p>
          <p className="text-muted-foreground pt-2 text-xs">
            Chaque export est enregistré dans le journal d'activité (auteur, périmètre, filtres,
            nombre de lignes).
          </p>
        </div>
        <Button asChild className="mt-6 h-11 w-full" disabled={matching === 0}>
          <a href={href()} download>
            <Download data-icon="inline-start" />
            Télécharger l'export
          </a>
        </Button>
      </aside>
    </div>
  );
}

function ScopeCard({
  value,
  checked,
  icon: Icon,
  title,
  text,
  disabled,
}: {
  value: string;
  checked: boolean;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  text: string;
  disabled?: boolean;
}) {
  const id = `opt-${value}`;
  return (
    <Label
      htmlFor={id}
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors",
        checked ? "border-brand-600 bg-brand-50/60" : "border-border hover:bg-muted/40",
        disabled && "cursor-not-allowed opacity-50",
      )}
    >
      <RadioGroupItem id={id} value={value} disabled={disabled} className="mt-0.5" />
      <span className="space-y-1">
        <span className="text-foreground flex items-center gap-2 text-sm font-medium">
          <Icon className="text-brand-700 size-4" />
          {title}
        </span>
        <span className="text-muted-foreground block text-xs leading-relaxed font-normal">
          {text}
        </span>
      </span>
    </Label>
  );
}
