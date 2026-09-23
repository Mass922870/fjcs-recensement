"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireManagementPermission } from "@/lib/auth/session";
import { toActionError, type ActionResult } from "@/lib/action-result";
import { ValidationError } from "@/lib/errors";
import { documentUploadSchema, titleFromFileName } from "@/schemas/management/documents";
import { deleteDocument, uploadDocument } from "@/services/management/documents.service";

const idSchema = z.string().min(1);

function revalidateDocuments(meetingId?: string) {
  revalidatePath("/management/documents");
  revalidatePath("/management/archives");
  if (meetingId) revalidatePath(`/management/reunions/${meetingId}`);
}

/**
 * Dépôt d'un document. Reçoit un FormData : un fichier ne se sérialise pas en
 * objet simple à travers une action serveur.
 */
export async function uploadDocumentAction(formData: FormData): Promise<ActionResult> {
  try {
    const actor = await requireManagementPermission("documents:upload");
    const parsed = documentUploadSchema.safeParse({
      title: formData.get("title"),
      meetingId: formData.get("meetingId"),
    });
    if (!parsed.success) {
      throw new ValidationError(
        "Données invalides.",
        z.flattenError(parsed.error).fieldErrors as Record<string, string[]>,
      );
    }
    const file = formData.get("file");
    if (!(file instanceof File)) throw new ValidationError("Aucun fichier sélectionné.");

    // Le titre est déduit ici plutôt que dans le navigateur : le serveur a le
    // fichier de toute façon, et la règle reste la même quel que soit l'appelant.
    const title = parsed.data.title ?? titleFromFileName(file.name);
    await uploadDocument({ title, file, meetingId: parsed.data.meetingId }, actor.id);
    revalidateDocuments(parsed.data.meetingId);
    return { ok: true };
  } catch (e) {
    return toActionError(e);
  }
}

export async function deleteDocumentAction(id: string): Promise<ActionResult> {
  try {
    const actor = await requireManagementPermission("documents:delete");
    await deleteDocument(idSchema.parse(id), actor.id);
    revalidateDocuments();
    return { ok: true };
  } catch (e) {
    return toActionError(e);
  }
}
