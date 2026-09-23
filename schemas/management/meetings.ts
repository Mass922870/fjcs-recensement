import { z } from "zod";
import { MeetingStatus, MeetingType } from "@/lib/generated/prisma/enums";

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

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^\d{2}:\d{2}$/;

export const agendaItemSchema = z.object({
  title: z.string().trim().min(2, "Au moins 2 caractères.").max(160),
  description: optionalText(500),
  duration: z
    .union([z.string(), z.number()])
    .optional()
    .transform((v) => {
      if (v === undefined || v === "") return undefined;
      const n = Number(v);
      return Number.isFinite(n) && n > 0 ? Math.round(n) : undefined;
    }),
});

export const meetingSchema = z
  .object({
    title: z.string().trim().min(3, "Au moins 3 caractères.").max(160),
    type: z.enum(MeetingType),
    date: z.string().regex(DATE, "Date requise."),
    startTime: z.string().regex(TIME, "Heure de début requise."),
    endTime: z
      .string()
      .optional()
      .or(z.literal(""))
      .refine((v) => !v || TIME.test(v), "Heure invalide.")
      .transform((v) => (v ? v : undefined)),
    location: optionalText(160),
    description: optionalText(1000),
    commissionId: optionalId,
    organizerId: optionalId,
    agenda: z.array(agendaItemSchema).max(40, "40 points au maximum."),
    participantIds: z.array(z.string().min(1)).max(300),
  })
  .refine((d) => !d.endTime || d.endTime > d.startTime, {
    path: ["endTime"],
    message: "La fin doit suivre le début.",
  })
  .refine((d) => d.type !== "COMMISSION" || Boolean(d.commissionId), {
    path: ["commissionId"],
    message: "Une réunion de commission doit désigner sa commission.",
  });

export type MeetingInput = z.infer<typeof meetingSchema>;

export const meetingFiltersSchema = z.object({
  q: optionalText(120),
  status: z.enum(MeetingStatus).optional(),
  type: z.enum(MeetingType).optional(),
  commissionId: optionalId,
  organizerId: optionalId,
  from: z
    .string()
    .optional()
    .refine((v) => !v || DATE.test(v), "Date invalide.")
    .transform((v) => (v ? v : undefined)),
  to: z
    .string()
    .optional()
    .refine((v) => !v || DATE.test(v), "Date invalide.")
    .transform((v) => (v ? v : undefined)),
  sort: z.enum(["date-desc", "date-asc", "title"]).catch("date-desc"),
  page: z.coerce.number().int().min(1).catch(1),
});
export type MeetingFilters = z.infer<typeof meetingFiltersSchema>;

/** Déplacement depuis le calendrier : on ne change que le jour, l'heure suit. */
export const rescheduleSchema = z.object({
  date: z.string().regex(DATE, "Date invalide."),
});

export const cancelMeetingSchema = z.object({
  reason: z.string().trim().min(3, "Indiquez brièvement le motif.").max(300),
});

/**
 * Construit l'instant d'une séance à partir du jour et de l'heure saisis.
 *
 * Interprétation en heure locale du serveur : Dakar est à UTC+0 toute l'année
 * et Vercel exécute en UTC, les deux coïncident donc en production.
 */
export function combineDateTime(date: string, time: string): Date {
  return new Date(`${date}T${time}:00`);
}
