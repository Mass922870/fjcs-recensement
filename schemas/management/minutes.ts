import { z } from "zod";
import { MinutesStatus } from "@/lib/generated/prisma/enums";

const optionalLongText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `${max} caractères maximum.`)
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : undefined));

const optionalId = z
  .string()
  .trim()
  .optional()
  .or(z.literal(""))
  .transform((v) => (v ? v : undefined));

/** Compte rendu d'un point de l'ordre du jour : échanges puis décision. */
export const minutesPointSchema = z.object({
  agendaItemId: z.string().min(1),
  discussion: optionalLongText(4000),
  decision: optionalLongText(1000),
});

export const minutesSchema = z.object({
  chairId: optionalId,
  secretaryId: optionalId,
  introduction: optionalLongText(3000),
  proceedings: optionalLongText(6000),
  observations: optionalLongText(3000),
  misc: optionalLongText(3000),
  conclusion: optionalLongText(3000),
  points: z.array(minutesPointSchema).max(40),
});
export type MinutesInput = z.infer<typeof minutesSchema>;

/**
 * Transitions autorisées du procès-verbal.
 *
 * Un PV validé ne revient pas en arrière par simple changement d'état : toute
 * reprise passe par une nouvelle version, qui le replace en révision.
 */
export const MINUTES_TRANSITIONS: Record<MinutesStatus, MinutesStatus[]> = {
  BROUILLON: ["EN_REVISION"],
  EN_REVISION: ["BROUILLON", "A_VALIDER"],
  A_VALIDER: ["EN_REVISION", "VALIDE"],
  VALIDE: ["ARCHIVE"],
  ARCHIVE: [],
};

export const minutesTransitionSchema = z.object({
  status: z.enum(MinutesStatus),
});

export const minutesRevisionSchema = z.object({
  reason: z.string().trim().min(5, "Indiquez le motif de la reprise.").max(300),
});
