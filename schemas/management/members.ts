import { z } from "zod";
import { MemberStatus } from "@/lib/generated/prisma/enums";
import { normalizePhone } from "@/lib/phone";

/** Champ texte facultatif : "" devient undefined plutôt qu'une chaîne vide. */
const optionalText = (max: number) =>
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

export const memberSchema = z.object({
  firstName: z.string().trim().min(2, "Au moins 2 caractères.").max(60),
  lastName: z.string().trim().min(2, "Au moins 2 caractères.").max(60),
  phone: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .refine(
      (v) => !v || normalizePhone(v) !== null,
      "Numéro de téléphone invalide (ex. 77 123 45 67).",
    )
    .transform((v) => (v ? v : undefined)),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .optional()
    .or(z.literal(""))
    .refine((v) => !v || z.email().safeParse(v).success, "Adresse e-mail invalide.")
    .transform((v) => (v ? v : undefined)),
  role: optionalText(60),
  commissionId: optionalId,
  status: z.enum(MemberStatus),
  joinedAt: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .refine((v) => !v || !Number.isNaN(Date.parse(v)), "Date invalide.")
    .transform((v) => (v ? new Date(v) : undefined)),
  notes: optionalText(500),
});
export type MemberInput = z.infer<typeof memberSchema>;

export const commissionSchema = z.object({
  name: z.string().trim().min(2, "Au moins 2 caractères.").max(80),
  acronym: optionalText(12),
  description: optionalText(300),
  isActive: z.boolean(),
});
export type CommissionInput = z.infer<typeof commissionSchema>;

export const memberFiltersSchema = z.object({
  q: optionalText(80),
  status: z.enum(MemberStatus).optional(),
  commissionId: optionalId,
  page: z.coerce.number().int().min(1).catch(1),
});
export type MemberFilters = z.infer<typeof memberFiltersSchema>;
