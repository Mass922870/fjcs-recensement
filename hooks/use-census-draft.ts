import { useSyncExternalStore } from "react";
import { readCensusDraft, subscribeCensusDraft, type CensusDraft } from "@/lib/census-draft";

/** Brouillon local courant (null côté serveur et en l'absence de brouillon). */
export function useCensusDraft(): CensusDraft | null {
  return useSyncExternalStore(subscribeCensusDraft, readCensusDraft, () => null);
}
