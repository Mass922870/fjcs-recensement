import { z } from "zod";
import { AttendanceStatus } from "@/lib/generated/prisma/enums";

const TIME = /^\d{2}:\d{2}$/;

const optionalTime = z
  .string()
  .optional()
  .or(z.literal(""))
  .refine((v) => !v || TIME.test(v), "Heure invalide.")
  .transform((v) => (v ? v : undefined));

export const attendanceEntrySchema = z.object({
  memberId: z.string().min(1),
  status: z.enum(AttendanceStatus),
  arrivedAt: optionalTime,
  leftAt: optionalTime,
  comment: z
    .string()
    .trim()
    .max(200, "200 caractères maximum.")
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : undefined)),
});
export type AttendanceEntryInput = z.infer<typeof attendanceEntrySchema>;

export const attendanceSheetSchema = z.object({
  entries: z.array(attendanceEntrySchema).max(300),
});

/** Durée de validité proposée pour un QR de pointage. */
export const TOKEN_TTL_MINUTES = [60, 180, 480] as const;

export const issueTokenSchema = z.object({
  ttlMinutes: z.coerce
    .number()
    .int()
    .refine((v) => (TOKEN_TTL_MINUTES as readonly number[]).includes(v), "Durée non autorisée."),
});

export const confirmPresenceSchema = z.object({
  token: z.string().min(20).max(200),
  memberId: z.string().min(1),
});
