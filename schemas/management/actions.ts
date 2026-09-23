import { z } from "zod";
import { ActionPriority, ActionStatus } from "@/lib/generated/prisma/enums";

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

export const actionItemSchema = z.object({
  title: z.string().trim().min(3, "Au moins 3 caractères.").max(160),
  description: optionalText(1000),
  assigneeId: optionalId,
  commissionId: optionalId,
  dueDate: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine((v) => !v || DATE.test(v), "Date invalide.")
    .transform((v) => (v ? new Date(`${v}T12:00:00`) : undefined)),
  priority: z.enum(ActionPriority),
  status: z.enum(ActionStatus),
  meetingId: optionalId,
  decisionId: optionalId,
});
export type ActionItemInput = z.infer<typeof actionItemSchema>;

/** Déplacement dans le Kanban : colonne cible et rang dans la colonne. */
export const moveActionSchema = z.object({
  status: z.enum(ActionStatus),
  position: z.coerce.number().int().min(0).max(9999),
});

export const actionFiltersSchema = z.object({
  q: optionalText(120),
  status: z.enum(ActionStatus).optional(),
  priority: z.enum(ActionPriority).optional(),
  assigneeId: optionalId,
  commissionId: optionalId,
  /** « retard » restreint aux actions dont l'échéance est dépassée. */
  due: z.enum(["retard", "semaine", "mois"]).optional(),
  view: z.enum(["kanban", "tableau"]).catch("kanban"),
});
export type ActionFilters = z.infer<typeof actionFiltersSchema>;

export const decisionSchema = z.object({
  meetingId: z.string().min(1),
  agendaItemId: optionalId,
  title: z.string().trim().min(3, "Au moins 3 caractères.").max(300),
  description: optionalText(1000),
});
