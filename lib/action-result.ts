import { AppError } from "./errors";

export type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string; code?: string; fieldErrors?: Record<string, string[]> };

/** Convertit une erreur en résultat d'action lisible, sans fuiter de détails techniques. */
export function toActionError(
  error: unknown,
  fallback = "Une erreur est survenue. Veuillez réessayer.",
): ActionResult<never> {
  if (error instanceof AppError) {
    return {
      ok: false,
      error: error.message,
      code: error.code,
      fieldErrors:
        "fieldErrors" in error
          ? (error as { fieldErrors?: Record<string, string[]> }).fieldErrors
          : undefined,
    };
  }
  console.error("[action]", error);
  return { ok: false, error: fallback };
}
