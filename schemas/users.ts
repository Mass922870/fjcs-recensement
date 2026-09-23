import { z } from "zod";
import { ManagementRole, Role } from "@/lib/generated/prisma/enums";
import { passwordSchema } from "./auth";

export const createUserSchema = z.object({
  name: z.string().trim().min(2, "Au moins 2 caractères.").max(80),
  email: z.string().trim().toLowerCase().pipe(z.email("Adresse e-mail invalide.")),
  role: z.enum(Role),
  password: passwordSchema,
});
export type CreateUserInput = z.infer<typeof createUserSchema>;

export const updateUserSchema = z.object({
  name: z.string().trim().min(2, "Au moins 2 caractères.").max(80),
  role: z.enum(Role),
  isActive: z.boolean(),
  /** Accès à FJCS Management. "" ou absent = aucun accès. */
  managementRole: z
    .enum(ManagementRole)
    .nullable()
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : null)),
});
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

export const resetPasswordSchema = z.object({ password: passwordSchema });

export const changeOwnPasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Mot de passe actuel requis."),
    newPassword: passwordSchema,
    confirm: z.string(),
  })
  .refine((d) => d.newPassword === d.confirm, {
    path: ["confirm"],
    message: "Les mots de passe ne correspondent pas.",
  });
