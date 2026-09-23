"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireManagementPermission } from "@/lib/auth/session";
import { toActionError, type ActionResult } from "@/lib/action-result";
import { ValidationError } from "@/lib/errors";
import {
  cancelMeetingSchema,
  meetingSchema,
  rescheduleSchema,
} from "@/schemas/management/meetings";
import {
  archiveMeeting,
  cancelMeeting,
  createMeeting,
  deleteMeeting,
  rescheduleMeeting,
  setMeetingStatus,
  updateMeeting,
} from "@/services/management/meetings.service";

function fieldErrors(error: z.ZodError): Record<string, string[]> {
  return z.flattenError(error).fieldErrors as Record<string, string[]>;
}

const idSchema = z.string().min(1);

/** Les deux vues qui listent des réunions doivent refléter tout changement. */
function revalidateMeetings(id?: string) {
  revalidatePath("/management/reunions");
  revalidatePath("/management/calendrier");
  revalidatePath("/management");
  if (id) revalidatePath(`/management/reunions/${id}`);
}

export async function createMeetingAction(
  values: unknown,
): Promise<ActionResult<{ id: string; reference: string }>> {
  try {
    const actor = await requireManagementPermission("meetings:create");
    const parsed = meetingSchema.safeParse(values);
    if (!parsed.success) throw new ValidationError("Données invalides.", fieldErrors(parsed.error));
    const meeting = await createMeeting(parsed.data, actor.id);
    revalidateMeetings();
    return { ok: true, data: meeting };
  } catch (e) {
    return toActionError(e);
  }
}

export async function updateMeetingAction(id: string, values: unknown): Promise<ActionResult> {
  try {
    const actor = await requireManagementPermission("meetings:edit");
    const parsed = meetingSchema.safeParse(values);
    if (!parsed.success) throw new ValidationError("Données invalides.", fieldErrors(parsed.error));
    await updateMeeting(idSchema.parse(id), parsed.data, actor.id);
    revalidateMeetings(id);
    return { ok: true };
  } catch (e) {
    return toActionError(e);
  }
}

export async function rescheduleMeetingAction(
  id: string,
  values: unknown,
): Promise<ActionResult> {
  try {
    const actor = await requireManagementPermission("meetings:edit");
    const parsed = rescheduleSchema.safeParse(values);
    if (!parsed.success) throw new ValidationError("Date invalide.", fieldErrors(parsed.error));
    await rescheduleMeeting(idSchema.parse(id), parsed.data.date, actor.id);
    revalidateMeetings(id);
    return { ok: true };
  } catch (e) {
    return toActionError(e);
  }
}

export async function cancelMeetingAction(id: string, values: unknown): Promise<ActionResult> {
  try {
    const actor = await requireManagementPermission("meetings:edit");
    const parsed = cancelMeetingSchema.safeParse(values);
    if (!parsed.success) throw new ValidationError("Motif requis.", fieldErrors(parsed.error));
    await cancelMeeting(idSchema.parse(id), parsed.data.reason, actor.id);
    revalidateMeetings(id);
    return { ok: true };
  } catch (e) {
    return toActionError(e);
  }
}

export async function setMeetingStatusAction(
  id: string,
  status: "PLANIFIEE" | "EN_COURS" | "TERMINEE",
): Promise<ActionResult> {
  try {
    const actor = await requireManagementPermission("meetings:edit");
    const parsed = z.enum(["PLANIFIEE", "EN_COURS", "TERMINEE"]).safeParse(status);
    if (!parsed.success) throw new ValidationError("État invalide.");
    await setMeetingStatus(idSchema.parse(id), parsed.data, actor.id);
    revalidateMeetings(id);
    return { ok: true };
  } catch (e) {
    return toActionError(e);
  }
}

export async function archiveMeetingAction(id: string): Promise<ActionResult> {
  try {
    const actor = await requireManagementPermission("meetings:edit");
    await archiveMeeting(idSchema.parse(id), actor.id);
    revalidateMeetings(id);
    return { ok: true };
  } catch (e) {
    return toActionError(e);
  }
}

export async function deleteMeetingAction(id: string): Promise<ActionResult> {
  try {
    const actor = await requireManagementPermission("meetings:delete");
    await deleteMeeting(idSchema.parse(id), actor.id);
    revalidateMeetings();
    return { ok: true };
  } catch (e) {
    return toActionError(e);
  }
}
