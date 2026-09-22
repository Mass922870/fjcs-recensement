"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requirePermission, getCurrentUser } from "@/lib/auth/session";
import { toActionError, type ActionResult } from "@/lib/action-result";
import { UnauthorizedError, ValidationError } from "@/lib/errors";
import {
  changeOwnPasswordSchema,
  createUserSchema,
  resetPasswordSchema,
  updateUserSchema,
} from "@/schemas/users";
import {
  changeOwnPassword,
  createUser,
  resetUserPassword,
  updateUser,
} from "@/services/users.service";

function fieldErrors(error: z.ZodError): Record<string, string[]> {
  return z.flattenError(error).fieldErrors as Record<string, string[]>;
}

export async function createUserAction(values: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    const actor = await requirePermission("users:manage");
    const parsed = createUserSchema.safeParse(values);
    if (!parsed.success) throw new ValidationError("Données invalides.", fieldErrors(parsed.error));
    const user = await createUser(parsed.data, actor.id);
    revalidatePath("/admin/utilisateurs");
    return { ok: true, data: user };
  } catch (e) {
    return toActionError(e);
  }
}

export async function updateUserAction(id: string, values: unknown): Promise<ActionResult> {
  try {
    const actor = await requirePermission("users:manage");
    const parsed = updateUserSchema.safeParse(values);
    if (!parsed.success) throw new ValidationError("Données invalides.", fieldErrors(parsed.error));
    await updateUser(z.string().min(1).parse(id), parsed.data, actor.id);
    revalidatePath("/admin/utilisateurs");
    return { ok: true };
  } catch (e) {
    return toActionError(e);
  }
}

export async function resetUserPasswordAction(id: string, values: unknown): Promise<ActionResult> {
  try {
    const actor = await requirePermission("users:manage");
    const parsed = resetPasswordSchema.safeParse(values);
    if (!parsed.success) throw new ValidationError("Données invalides.", fieldErrors(parsed.error));
    await resetUserPassword(z.string().min(1).parse(id), parsed.data.password, actor.id);
    return { ok: true };
  } catch (e) {
    return toActionError(e);
  }
}

export async function changeOwnPasswordAction(values: unknown): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user) throw new UnauthorizedError();
    const parsed = changeOwnPasswordSchema.safeParse(values);
    if (!parsed.success) throw new ValidationError("Données invalides.", fieldErrors(parsed.error));
    await changeOwnPassword(user.id, parsed.data.currentPassword, parsed.data.newPassword);
    return { ok: true };
  } catch (e) {
    return toActionError(e);
  }
}
