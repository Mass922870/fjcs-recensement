import { z } from "zod";
import { Gender } from "@/lib/generated/prisma/enums";
import { AGE_BRACKETS } from "@/lib/constants/referentials";

const ageKeys = AGE_BRACKETS.map((b) => b.key) as [string, ...string[]];
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const emptyToUndefined = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((v) => (v === "" || v === null ? undefined : v), schema.optional());

/** Filtres globaux (dashboard, statistiques, carto, exports, rapports) - lus depuis l'URL. */
export const statsFiltersSchema = z.object({
  from: emptyToUndefined(isoDate),
  to: emptyToUndefined(isoDate),
  gender: emptyToUndefined(z.enum(Gender)),
  age: emptyToUndefined(z.enum(ageKeys)),
  quartier: emptyToUndefined(z.string().max(60)),
  education: emptyToUndefined(z.string().max(60)),
  employment: emptyToUndefined(z.string().max(60)),
  skill: emptyToUndefined(z.string().max(60)),
  need: emptyToUndefined(z.string().max(60)),
});

export type StatsFilters = z.infer<typeof statsFiltersSchema>;

export const STATS_FILTER_KEYS = Object.keys(statsFiltersSchema.shape) as (keyof StatsFilters)[];

/** Parse tolérant des searchParams : les valeurs invalides sont ignorées. */
export function parseStatsFilters(sp: Record<string, string | string[] | undefined>): StatsFilters {
  const raw: Record<string, unknown> = {};
  for (const key of STATS_FILTER_KEYS) {
    const v = sp[key];
    raw[key] = Array.isArray(v) ? v[0] : v;
  }
  const result = statsFiltersSchema.safeParse(raw);
  if (result.success) return result.data;
  // Retire uniquement les clés fautives.
  const bad = new Set(result.error.issues.map((i) => String(i.path[0])));
  for (const k of bad) delete raw[k];
  const retry = statsFiltersSchema.safeParse(raw);
  return retry.success ? retry.data : {};
}

export function countActiveFilters(f: StatsFilters): number {
  return STATS_FILTER_KEYS.filter((k) => f[k] !== undefined).length;
}
