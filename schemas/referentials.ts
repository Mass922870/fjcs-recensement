import { z } from "zod";
import { EmploymentKind } from "@/lib/generated/prisma/enums";
import { REFERENTIAL_KIND_LIST } from "@/lib/constants/referential-kinds";

const optionalNumber = (min: number, max: number) =>
  z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? undefined : Number(v)),
    z.number({ error: "Valeur invalide." }).min(min).max(max).optional(),
  );

/** Champs communs + champs spécifiques (ignorés pour les référentiels qui ne les utilisent pas). */
export const referentialItemSchema = z.object({
  label: z.string().trim().min(2, "Au moins 2 caractères.").max(80, "80 caractères maximum."),
  isActive: z.boolean().default(true),
  // quartier
  latitude: optionalNumber(-90, 90),
  longitude: optionalNumber(-180, 180),
  // skill
  categoryId: z.string().max(64).optional().or(z.literal("")),
  // need
  question: z.string().trim().max(160).optional().or(z.literal("")),
  // employmentStatus
  kind: z.enum(EmploymentKind).optional(),
  requiresDetail: z.boolean().optional(),
});
export type ReferentialItemInput = z.infer<typeof referentialItemSchema>;

export const referentialKindSchema = z.enum(REFERENTIAL_KIND_LIST as [string, ...string[]]);
