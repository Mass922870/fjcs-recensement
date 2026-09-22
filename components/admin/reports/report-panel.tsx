"use client";

import { useSearchParams } from "next/navigation";
import { Download, ExternalLink, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { STATS_FILTER_KEYS } from "@/schemas/filters";

const nf = new Intl.NumberFormat("fr-FR");

const CONTENTS = [
  "Logo FJCS, titre, date de génération et période analysée",
  "Chiffres clés : effectif, nouveaux inscrits, entrepreneurs, étudiants, demandeurs d'emploi",
  "Démographie : sexe, tranches d'âge, quartiers",
  "Formation, emploi, entrepreneuriat (formalisation, secteurs)",
  "Compétences, besoins exprimés, centres d'intérêt",
  "Conclusion descriptive générée uniquement à partir des données",
];

export function ReportPanel({ matching, periodLabel }: { matching: number; periodLabel: string }) {
  const sp = useSearchParams();
  const href = (download: boolean) => {
    const params = new URLSearchParams();
    for (const k of STATS_FILTER_KEYS) {
      const v = sp.get(k);
      if (v) params.set(k, v);
    }
    if (download) params.set("download", "1");
    return `/api/rapports?${params.toString()}`;
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <div className="border-border rounded-2xl border bg-white p-5">
        <div className="mb-4 flex items-center gap-3">
          <span className="bg-brand-50 text-brand-700 flex size-10 items-center justify-center rounded-lg">
            <FileText className="size-5" />
          </span>
          <div>
            <p className="text-foreground text-sm font-semibold">Rapport général (PDF)</p>
            <p className="text-muted-foreground text-xs">
              Document A4 prêt à partager avec les partenaires du FJCS.
            </p>
          </div>
        </div>
        <ul className="space-y-2">
          {CONTENTS.map((c) => (
            <li key={c} className="text-muted-foreground flex gap-2 text-sm">
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-cyan-500" />
              {c}
            </li>
          ))}
        </ul>
        <p className="text-muted-foreground mt-4 text-xs">
          Les exports tabulaires (CSV / Excel) sont disponibles dans la page Exports. Chaque
          génération est journalisée.
        </p>
      </div>

      <aside className="border-border flex flex-col justify-between rounded-2xl border bg-white p-5">
        <div className="space-y-2">
          <p className="text-foreground text-sm font-semibold">Périmètre</p>
          <p className="text-foreground text-3xl font-semibold">{nf.format(matching)}</p>
          <p className="text-muted-foreground text-sm">
            profil{matching > 1 ? "s" : ""} - {periodLabel.toLowerCase()}.
          </p>
        </div>
        <div className="mt-6 space-y-2">
          <Button asChild className="h-11 w-full">
            <a href={href(true)} download>
              <Download data-icon="inline-start" />
              Télécharger le PDF
            </a>
          </Button>
          <Button asChild variant="outline" className="h-11 w-full">
            <a href={href(false)} target="_blank" rel="noreferrer">
              <ExternalLink data-icon="inline-start" />
              Aperçu dans le navigateur
            </a>
          </Button>
        </div>
      </aside>
    </div>
  );
}
