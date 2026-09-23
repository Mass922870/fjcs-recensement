import { z } from "zod";

/**
 * Champ de formulaire tel que `FormData.get()` le renvoie.
 *
 * Un champ absent vaut `null`, pas `undefined` : sans cette conversion, un
 * dépôt depuis la page Documents, qui n'a pas de champ « réunion », échouait
 * en validation alors que la saisie était correcte.
 */
const formField = z.preprocess(
  (v) => (typeof v === "string" ? v : undefined),
  z.string().optional(),
);

export const documentUploadSchema = z.object({
  /** Facultatif : le nom du fichier sert de titre lorsqu'il n'est pas saisi. */
  title: formField.pipe(
    z
      .string()
      .trim()
      .max(160, "160 caractères maximum.")
      .optional()
      .transform((v) => (v ? v : undefined)),
  ),
  meetingId: formField.pipe(
    z
      .string()
      .trim()
      .optional()
      .transform((v) => (v ? v : undefined)),
  ),
});

/** Titre par défaut : le nom du fichier, extension retirée. */
export function titleFromFileName(name: string): string {
  const stem = name.replace(/\.[^.]+$/, "").trim();
  return (stem || name).slice(0, 160);
}
