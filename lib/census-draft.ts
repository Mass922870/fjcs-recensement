import type { CensusFormInput } from "@/schemas/youth";

/**
 * Brouillon du formulaire de recensement, stocké localement sur l'appareil du
 * participant (jamais envoyé au serveur avant validation).
 */
export interface CensusDraft {
  version: 1;
  step: number;
  startedAt: number;
  savedAt: number;
  values: CensusFormInput;
}

const KEY = "fjcs.census.draft.v1";
const EVENT = "fjcs:census-draft";
/** Un brouillon de plus de 14 jours est ignoré. */
const MAX_AGE_MS = 14 * 24 * 3600 * 1000;

let cachedRaw: string | null | undefined;
let cachedDraft: CensusDraft | null = null;

function parse(raw: string | null): CensusDraft | null {
  if (!raw) return null;
  try {
    const d = JSON.parse(raw) as CensusDraft;
    if (d.version !== 1 || Date.now() - d.savedAt > MAX_AGE_MS) return null;
    return d;
  } catch {
    return null;
  }
}

export function readCensusDraft(): CensusDraft | null {
  if (typeof window === "undefined") return null;
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(KEY);
  } catch {
    return null;
  }
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedDraft = parse(raw);
  }
  return cachedDraft;
}

export function writeCensusDraft(draft: Omit<CensusDraft, "version" | "savedAt">): void {
  try {
    // Le consentement n'est jamais pré-rempli.
    const values: CensusFormInput = {
      ...draft.values,
      consent: { consent: undefined as unknown as true },
    };
    const payload: CensusDraft = { ...draft, values, version: 1, savedAt: Date.now() };
    window.localStorage.setItem(KEY, JSON.stringify(payload));
    window.dispatchEvent(new Event(EVENT));
  } catch {
    /* stockage indisponible (navigation privée…) : on continue sans brouillon */
  }
}

export function clearCensusDraft(): void {
  try {
    window.localStorage.removeItem(KEY);
    window.dispatchEvent(new Event(EVENT));
  } catch {
    /* ignore */
  }
}

export function subscribeCensusDraft(callback: () => void): () => void {
  window.addEventListener(EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}
