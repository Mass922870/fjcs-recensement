"use server";

import { z } from "zod";
import { createCensusSchema, censusMetaSchema, type CensusFormInput } from "@/schemas/youth";
import { createYouthProfile } from "@/services/youth.service";
import { getAgeBounds, isFormOpen } from "@/services/settings.service";
import { rateLimit } from "@/lib/security/rate-limit";
import { getClientIp, getUserAgent, hashIp } from "@/lib/security/request";
import { verifyTurnstile } from "@/lib/security/turnstile";
import { DuplicatePhoneError } from "@/lib/errors";

export type SubmitCensusResult =
  | { ok: true; participationCode: string }
  | {
      ok: false;
      code: "RATE_LIMITED" | "DUPLICATE" | "VALIDATION" | "FORM_CLOSED" | "REJECTED" | "ERROR";
      message: string;
      fieldErrors?: Record<string, string[]>;
    };

/** Délai minimal de remplissage (ms) - un humain ne remplit pas 7 étapes en 8 secondes. */
const MIN_FILL_TIME_MS = 8_000;

/**
 * Soumission du formulaire public de recensement.
 * Toutes les vérifications de sécurité sont effectuées ici, côté serveur.
 */
export async function submitCensus(
  values: CensusFormInput,
  meta: { website?: string; startedAt: number; turnstileToken?: string },
): Promise<SubmitCensusResult> {
  const ip = await getClientIp();
  const ipHash = hashIp(ip);

  // 1. Rate limiting par IP (5 soumissions / heure)
  const rl = await rateLimit("census:submit", ipHash, { limit: 5, windowSeconds: 3600 });
  if (!rl.ok) {
    return {
      ok: false,
      code: "RATE_LIMITED",
      message: `Trop de tentatives. Réessayez dans ${Math.ceil(rl.retryAfterSeconds / 60)} minute(s).`,
    };
  }

  // 2. Formulaire ouvert ?
  if (!(await isFormOpen())) {
    return {
      ok: false,
      code: "FORM_CLOSED",
      message: "Le recensement est momentanément fermé. Merci de revenir plus tard.",
    };
  }

  // 3. Anti-bot : honeypot, délai minimal, Turnstile (si configuré)
  const metaParsed = censusMetaSchema.safeParse(meta);
  const tooFast = metaParsed.success && Date.now() - metaParsed.data.startedAt < MIN_FILL_TIME_MS;
  const turnstileOk = metaParsed.success
    ? await verifyTurnstile(metaParsed.data.turnstileToken, ip)
    : false;
  if (!metaParsed.success || tooFast || !turnstileOk) {
    return {
      ok: false,
      code: "REJECTED",
      message: "La soumission n'a pas pu être vérifiée. Veuillez réessayer.",
    };
  }

  // 4. Validation complète avec les bornes d'âge configurées
  const bounds = await getAgeBounds();
  const parsed = createCensusSchema(bounds).safeParse(values);
  if (!parsed.success) {
    const flat = z.flattenError(parsed.error);
    return {
      ok: false,
      code: "VALIDATION",
      message: "Certaines informations sont invalides. Vérifiez les champs signalés.",
      fieldErrors: flat.fieldErrors as Record<string, string[]>,
    };
  }

  // 5. Création (doublon détecté par le service)
  try {
    const profile = await createYouthProfile(parsed.data, {
      source: "PUBLIC",
      ipHash,
      userAgent: await getUserAgent(),
    });
    return { ok: true, participationCode: profile.participationCode };
  } catch (error) {
    if (error instanceof DuplicatePhoneError) {
      return {
        ok: false,
        code: "DUPLICATE",
        message:
          "Ce numéro de téléphone est déjà associé à une inscription. Si vous pensez qu'il s'agit d'une erreur, contactez le FJCS.",
      };
    }
    console.error("[submitCensus]", error);
    return { ok: false, code: "ERROR", message: "Une erreur est survenue. Veuillez réessayer." };
  }
}
