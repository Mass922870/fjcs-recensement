import { z } from "zod";

export const settingsSchema = z
  .object({
    minAge: z.coerce.number().int().min(10).max(40),
    maxAge: z.coerce.number().int().min(15).max(60),
    formOpen: z.boolean(),
    retentionMonths: z.coerce.number().int().min(6).max(120),
    contactEmail: z.string().trim().toLowerCase().pipe(z.email("Adresse e-mail invalide.")),
    contactPhone: z.string().trim().max(30).optional().or(z.literal("")),
    contactAddress: z.string().trim().max(200),
  })
  .refine((d) => d.maxAge > d.minAge, {
    path: ["maxAge"],
    message: "L'âge maximal doit dépasser l'âge minimal.",
  });

export type SettingsInput = z.infer<typeof settingsSchema>;
