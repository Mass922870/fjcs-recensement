"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth/session";
import { toActionError, type ActionResult } from "@/lib/action-result";
import { ValidationError } from "@/lib/errors";
import type { ReferentialKind } from "@/lib/constants/referential-kinds";
import { referentialItemSchema, referentialKindSchema } from "@/schemas/referentials";
import {
  deleteReferentialItem,
  moveReferentialItem,
  saveReferentialItem,
} from "@/services/referential-admin.service";

function revalidateAll() {
  for (const p of [
    "/admin/parametres/referentiels",
    "/admin",
    "/admin/jeunes",
    "/admin/statistiques",
    "/admin/cartographie",
    "/recensement",
  ]) {
    revalidatePath(p);
  }
}

function parseKind(kind: string): ReferentialKind {
  return referentialKindSchema.parse(kind) as ReferentialKind;
}

export async function saveReferentialAction(
  kind: string,
  id: string | null,
  values: unknown,
): Promise<ActionResult> {
  try {
    const actor = await requirePermission("settings:manage");
    const parsed = referentialItemSchema.safeParse(values);
    if (!parsed.success) {
      throw new ValidationError(
        "Données invalides.",
        z.flattenError(parsed.error).fieldErrors as Record<string, string[]>,
      );
    }
    await saveReferentialItem(
      parseKind(kind),
      id ? z.string().min(1).parse(id) : null,
      parsed.data,
      actor.id,
    );
    revalidateAll();
    return { ok: true };
  } catch (e) {
    return toActionError(e);
  }
}

export async function deleteReferentialAction(kind: string, id: string): Promise<ActionResult> {
  try {
    const actor = await requirePermission("settings:manage");
    await deleteReferentialItem(parseKind(kind), z.string().min(1).parse(id), actor.id);
    revalidateAll();
    return { ok: true };
  } catch (e) {
    return toActionError(e);
  }
}

export async function moveReferentialAction(
  kind: string,
  id: string,
  direction: "up" | "down",
): Promise<ActionResult> {
  try {
    const actor = await requirePermission("settings:manage");
    await moveReferentialItem(
      parseKind(kind),
      z.string().min(1).parse(id),
      direction === "up" ? "up" : "down",
      actor.id,
    );
    revalidateAll();
    return { ok: true };
  } catch (e) {
    return toActionError(e);
  }
}
