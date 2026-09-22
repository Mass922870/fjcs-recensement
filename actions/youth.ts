"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth/session";
import { getHashedClientIp } from "@/lib/security/request";
import { toActionError, type ActionResult } from "@/lib/action-result";
import { ValidationError } from "@/lib/errors";
import { createCensusSchema, type CensusFormInput } from "@/schemas/youth";
import { getAgeBounds } from "@/services/settings.service";
import {
  anonymizeYouthProfile,
  deleteYouthProfile,
  setYouthArchived,
  updateYouthProfile,
} from "@/services/youth.service";

const idSchema = z.string().min(1).max(64);

function revalidateYouth(id: string) {
  revalidatePath("/admin/jeunes");
  revalidatePath(`/admin/jeunes/${id}`);
  revalidatePath("/admin");
}

export async function updateYouthAction(
  rawId: string,
  values: CensusFormInput,
): Promise<ActionResult> {
  try {
    const user = await requirePermission("youth:write");
    const id = idSchema.parse(rawId);
    // L'admin peut corriger un âge hors bornes actuelles : on élargit la plage pour l'édition.
    const bounds = await getAgeBounds();
    const parsed = createCensusSchema({
      minAge: Math.min(bounds.minAge, 10),
      maxAge: Math.max(bounds.maxAge, 60),
    }).safeParse(values);
    if (!parsed.success) {
      const flat = z.flattenError(parsed.error);
      throw new ValidationError(
        "Certaines informations sont invalides.",
        flat.fieldErrors as Record<string, string[]>,
      );
    }
    await updateYouthProfile(id, parsed.data, {
      actorId: user.id,
      ipHash: await getHashedClientIp(),
    });
    revalidateYouth(id);
    return { ok: true };
  } catch (e) {
    return toActionError(e);
  }
}

export async function archiveYouthAction(rawId: string, archived: boolean): Promise<ActionResult> {
  try {
    const user = await requirePermission("youth:archive");
    const id = idSchema.parse(rawId);
    await setYouthArchived(id, archived, { actorId: user.id, ipHash: await getHashedClientIp() });
    revalidateYouth(id);
    return { ok: true };
  } catch (e) {
    return toActionError(e);
  }
}

export async function anonymizeYouthAction(rawId: string): Promise<ActionResult> {
  try {
    const user = await requirePermission("youth:anonymize");
    const id = idSchema.parse(rawId);
    await anonymizeYouthProfile(id, { actorId: user.id, ipHash: await getHashedClientIp() });
    revalidateYouth(id);
    return { ok: true };
  } catch (e) {
    return toActionError(e);
  }
}

export async function deleteYouthAction(rawId: string): Promise<ActionResult> {
  try {
    const user = await requirePermission("youth:delete");
    const id = idSchema.parse(rawId);
    await deleteYouthProfile(id, { actorId: user.id, ipHash: await getHashedClientIp() });
    revalidatePath("/admin/jeunes");
    revalidatePath("/admin");
    return { ok: true };
  } catch (e) {
    return toActionError(e);
  }
}
