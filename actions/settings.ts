"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth/session";
import { getHashedClientIp } from "@/lib/security/request";
import { toActionError, type ActionResult } from "@/lib/action-result";
import { ValidationError } from "@/lib/errors";
import { settingsSchema } from "@/schemas/settings";
import { getSetting, saveSettings, setSetting } from "@/services/settings.service";
import { applyRetentionPolicy } from "@/services/youth.service";
import { SETTING_KEYS } from "@/lib/constants/settings";

const fieldErrors = (e: z.ZodError) => z.flattenError(e).fieldErrors as Record<string, string[]>;

export async function saveSettingsAction(values: unknown): Promise<ActionResult> {
  try {
    const actor = await requirePermission("settings:manage");
    const parsed = settingsSchema.safeParse(values);
    if (!parsed.success) throw new ValidationError("Données invalides.", fieldErrors(parsed.error));
    await saveSettings(parsed.data, actor.id);
    revalidatePath("/admin/parametres");
    revalidatePath("/recensement");
    revalidatePath("/contact");
    revalidatePath("/confidentialite");
    return { ok: true };
  } catch (e) {
    return toActionError(e);
  }
}

/** Anonymise les profils plus anciens que la durée de conservation configurée. */
export async function applyRetentionAction(): Promise<
  ActionResult<{ count: number; months: number }>
> {
  try {
    const actor = await requirePermission("youth:anonymize");
    const months = Number(await getSetting(SETTING_KEYS.RETENTION_MONTHS));
    const count = await applyRetentionPolicy(months, {
      actorId: actor.id,
      ipHash: await getHashedClientIp(),
    });
    revalidatePath("/admin");
    revalidatePath("/admin/jeunes");
    return { ok: true, data: { count, months } };
  } catch (e) {
    return toActionError(e);
  }
}

/** Ouvre / ferme le formulaire public immédiatement (sans passer par le formulaire complet). */
export async function setFormOpenAction(open: boolean): Promise<ActionResult<{ open: boolean }>> {
  try {
    const actor = await requirePermission("settings:manage");
    await setSetting(SETTING_KEYS.FORM_OPEN, open ? "true" : "false", actor.id);
    revalidatePath("/recensement");
    revalidatePath("/admin/parametres");
    return { ok: true, data: { open } };
  } catch (e) {
    return toActionError(e);
  }
}
