import { FlaskConical } from "lucide-react";
import { isDemoDataVisible } from "@/lib/demo-data";

/** Bandeau visible uniquement quand les données de démonstration sont affichées (dev). */
export function DemoBanner() {
  if (!isDemoDataVisible()) return null;
  return (
    <div className="border-warning/40 mb-6 flex items-center gap-3 rounded-xl border bg-amber-50 px-4 py-2.5 text-sm text-amber-900">
      <FlaskConical className="size-4 shrink-0" />
      <p>
        <span className="font-medium">Données de démonstration affichées</span> -
        SHOW_DEMO_DATA=true. Ces profils fictifs n'existent jamais en production.
      </p>
    </div>
  );
}
