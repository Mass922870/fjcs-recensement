import { z } from "zod";
import { ProfileStatus } from "@/lib/generated/prisma/enums";
import { statsFiltersSchema } from "./filters";

export const YOUTH_SORT_FIELDS = ["createdAt", "lastName", "birthDate", "quartier"] as const;
export type YouthSortField = (typeof YOUTH_SORT_FIELDS)[number];

export const youthListParamsSchema = statsFiltersSchema.extend({
  q: z.preprocess((v) => (v === "" ? undefined : v), z.string().trim().max(80).optional()),
  status: z.preprocess((v) => (v === "" ? undefined : v), z.enum(ProfileStatus).optional()),
  sort: z.enum(YOUTH_SORT_FIELDS).default("createdAt"),
  dir: z.enum(["asc", "desc"]).default("desc"),
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(10).max(100).default(20),
});

export type YouthListParams = z.infer<typeof youthListParamsSchema>;

export function parseYouthListParams(
  sp: Record<string, string | string[] | undefined>,
): YouthListParams {
  const raw: Record<string, unknown> = {};
  for (const key of Object.keys(youthListParamsSchema.shape)) {
    const v = sp[key];
    raw[key] = Array.isArray(v) ? v[0] : v;
  }
  const r = youthListParamsSchema.safeParse(raw);
  if (r.success) return r.data;
  const bad = new Set(r.error.issues.map((i) => String(i.path[0])));
  for (const k of bad) delete raw[k];
  const retry = youthListParamsSchema.safeParse(raw);
  return retry.success ? retry.data : youthListParamsSchema.parse({});
}
