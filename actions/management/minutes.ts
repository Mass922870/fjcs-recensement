"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireManagementPermission } from "@/lib/auth/session";
import { toActionError, type ActionResult } from "@/lib/action-result";
import { ValidationError } from "@/lib/errors";
import {
  minutesRevisionSchema,
  minutesSchema,
  minutesTransitionSchema,
} from "@/schemas/management/minutes";
import {
  getOrCreateMinutes,
  openNewVersion,
  saveMinutes,
  transitionMinutes,
} from "@/services/management/minutes.service";

function fieldErrors(error: z.ZodError): Record<string, string[]> {
  return z.flattenError(error).fieldErrors as Record<string, string[]>;
}

const idSchema = z.string().min(1);

function revalidateMinutes(meetingId: string) {
  revalidatePath(`/management/reunions/${meetingId}`);
  revalidatePath(`/management/reunions/${meetingId}/proces-verbal`);
  revalidatePath("/management/proces-verbaux");
  revalidatePath("/management");
}

export async function openMinutesAction(meetingId: string): Promise<ActionResult> {
  try {
    const actor = await requireManagementPermission("minutes:create");
    await getOrCreateMinutes(idSchema.parse(meetingId), actor.id);
    revalidateMinutes(meetingId);
    return { ok: true };
  } catch (e) {
    return toActionError(e);
  }
}

export async function saveMinutesAction(
  meetingId: string,
  values: unknown,
): Promise<ActionResult> {
  try {
    const actor = await requireManagementPermission("minutes:edit");
    const parsed = minutesSchema.safeParse(values);
    if (!parsed.success) throw new ValidationError("Données invalides.", fieldErrors(parsed.error));
    await saveMinutes(idSchema.parse(meetingId), parsed.data, actor.id);
    revalidateMinutes(meetingId);
    return { ok: true };
  } catch (e) {
    return toActionError(e);
  }
}

/**
 * Avance le procès-verbal dans son cycle. La validation exige la permission
 * dédiée, réservée à la présidence, et non la simple permission d'édition.
 */
export async function transitionMinutesAction(
  meetingId: string,
  values: unknown,
): Promise<ActionResult> {
  try {
    const parsed = minutesTransitionSchema.safeParse(values);
    if (!parsed.success) throw new ValidationError("État invalide.");
    const actor = await requireManagementPermission(
      parsed.data.status === "VALIDE" ? "minutes:validate" : "minutes:edit",
    );
    await transitionMinutes(idSchema.parse(meetingId), parsed.data.status, actor.id);
    revalidateMinutes(meetingId);
    return { ok: true };
  } catch (e) {
    return toActionError(e);
  }
}

export async function openMinutesVersionAction(
  meetingId: string,
  values: unknown,
): Promise<ActionResult> {
  try {
    const actor = await requireManagementPermission("minutes:validate");
    const parsed = minutesRevisionSchema.safeParse(values);
    if (!parsed.success) throw new ValidationError("Motif requis.", fieldErrors(parsed.error));
    await openNewVersion(idSchema.parse(meetingId), parsed.data.reason, actor.id);
    revalidateMinutes(meetingId);
    return { ok: true };
  } catch (e) {
    return toActionError(e);
  }
}
