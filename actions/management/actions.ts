"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireManagementPermission } from "@/lib/auth/session";
import { toActionError, type ActionResult } from "@/lib/action-result";
import { ValidationError } from "@/lib/errors";
import { actionItemSchema, moveActionSchema } from "@/schemas/management/actions";
import {
  createAction,
  createActionFromDecision,
  deleteAction,
  moveAction,
  updateAction,
} from "@/services/management/actions.service";

function fieldErrors(error: z.ZodError): Record<string, string[]> {
  return z.flattenError(error).fieldErrors as Record<string, string[]>;
}

const idSchema = z.string().min(1);

function revalidateActions(meetingId?: string | null) {
  revalidatePath("/management/actions");
  revalidatePath("/management");
  if (meetingId) revalidatePath(`/management/reunions/${meetingId}`);
}

export async function createActionAction(values: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    const actor = await requireManagementPermission("actions:create");
    const parsed = actionItemSchema.safeParse(values);
    if (!parsed.success) throw new ValidationError("Données invalides.", fieldErrors(parsed.error));
    const action = await createAction(parsed.data, actor.id);
    revalidateActions(parsed.data.meetingId);
    return { ok: true, data: action };
  } catch (e) {
    return toActionError(e);
  }
}

export async function updateActionAction(id: string, values: unknown): Promise<ActionResult> {
  try {
    const parsed = actionItemSchema.safeParse(values);
    if (!parsed.success) throw new ValidationError("Données invalides.", fieldErrors(parsed.error));
    // Clôturer demande la permission dédiée, distincte de la simple édition.
    const actor = await requireManagementPermission(
      parsed.data.status === "TERMINE" ? "actions:close" : "actions:edit",
    );
    await updateAction(idSchema.parse(id), parsed.data, actor.id);
    revalidateActions(parsed.data.meetingId);
    return { ok: true };
  } catch (e) {
    return toActionError(e);
  }
}

export async function moveActionAction(id: string, values: unknown): Promise<ActionResult> {
  try {
    const parsed = moveActionSchema.safeParse(values);
    if (!parsed.success) throw new ValidationError("Déplacement invalide.");
    const actor = await requireManagementPermission(
      parsed.data.status === "TERMINE" ? "actions:close" : "actions:edit",
    );
    await moveAction(idSchema.parse(id), parsed.data.status, parsed.data.position, actor.id);
    revalidateActions();
    return { ok: true };
  } catch (e) {
    return toActionError(e);
  }
}

export async function deleteActionAction(id: string): Promise<ActionResult> {
  try {
    const actor = await requireManagementPermission("actions:edit");
    await deleteAction(idSchema.parse(id), actor.id);
    revalidateActions();
    return { ok: true };
  } catch (e) {
    return toActionError(e);
  }
}

export async function createActionFromDecisionAction(
  decisionId: string,
  values: unknown,
): Promise<ActionResult<{ id: string }>> {
  try {
    const actor = await requireManagementPermission("actions:create");
    const parsed = actionItemSchema.safeParse(values);
    if (!parsed.success) throw new ValidationError("Données invalides.", fieldErrors(parsed.error));
    const action = await createActionFromDecision(
      idSchema.parse(decisionId),
      parsed.data,
      actor.id,
    );
    revalidateActions(parsed.data.meetingId);
    return { ok: true, data: action };
  } catch (e) {
    return toActionError(e);
  }
}
