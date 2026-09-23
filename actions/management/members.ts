"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireManagementPermission } from "@/lib/auth/session";
import { toActionError, type ActionResult } from "@/lib/action-result";
import { ValidationError } from "@/lib/errors";
import { commissionSchema, memberSchema } from "@/schemas/management/members";
import {
  archiveMember,
  createCommission,
  createMember,
  deleteCommission,
  updateCommission,
  updateMember,
} from "@/services/management/members.service";

function fieldErrors(error: z.ZodError): Record<string, string[]> {
  return z.flattenError(error).fieldErrors as Record<string, string[]>;
}

const idSchema = z.string().min(1);

export async function createMemberAction(values: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    const actor = await requireManagementPermission("members:manage");
    const parsed = memberSchema.safeParse(values);
    if (!parsed.success) throw new ValidationError("Données invalides.", fieldErrors(parsed.error));
    const member = await createMember(parsed.data, actor.id);
    revalidatePath("/management/membres");
    return { ok: true, data: member };
  } catch (e) {
    return toActionError(e);
  }
}

export async function updateMemberAction(id: string, values: unknown): Promise<ActionResult> {
  try {
    const actor = await requireManagementPermission("members:manage");
    const parsed = memberSchema.safeParse(values);
    if (!parsed.success) throw new ValidationError("Données invalides.", fieldErrors(parsed.error));
    await updateMember(idSchema.parse(id), parsed.data, actor.id);
    revalidatePath("/management/membres");
    return { ok: true };
  } catch (e) {
    return toActionError(e);
  }
}

export async function archiveMemberAction(id: string): Promise<ActionResult> {
  try {
    const actor = await requireManagementPermission("members:manage");
    await archiveMember(idSchema.parse(id), actor.id);
    revalidatePath("/management/membres");
    return { ok: true };
  } catch (e) {
    return toActionError(e);
  }
}

export async function createCommissionAction(
  values: unknown,
): Promise<ActionResult<{ id: string }>> {
  try {
    const actor = await requireManagementPermission("commissions:manage");
    const parsed = commissionSchema.safeParse(values);
    if (!parsed.success) throw new ValidationError("Données invalides.", fieldErrors(parsed.error));
    const commission = await createCommission(parsed.data, actor.id);
    revalidatePath("/management/parametres");
    return { ok: true, data: commission };
  } catch (e) {
    return toActionError(e);
  }
}

export async function updateCommissionAction(id: string, values: unknown): Promise<ActionResult> {
  try {
    const actor = await requireManagementPermission("commissions:manage");
    const parsed = commissionSchema.safeParse(values);
    if (!parsed.success) throw new ValidationError("Données invalides.", fieldErrors(parsed.error));
    await updateCommission(idSchema.parse(id), parsed.data, actor.id);
    revalidatePath("/management/parametres");
    return { ok: true };
  } catch (e) {
    return toActionError(e);
  }
}

export async function deleteCommissionAction(id: string): Promise<ActionResult> {
  try {
    const actor = await requireManagementPermission("commissions:manage");
    await deleteCommission(idSchema.parse(id), actor.id);
    revalidatePath("/management/parametres");
    return { ok: true };
  } catch (e) {
    return toActionError(e);
  }
}
