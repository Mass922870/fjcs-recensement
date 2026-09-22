import { parsePhoneNumberFromString } from "libphonenumber-js/min";

/**
 * Normalise un numéro sénégalais (ou international) au format E.164.
 * Retourne null si le numéro est invalide.
 */
export function normalizePhone(input: string): string | null {
  const cleaned = input.trim();
  if (!cleaned) return null;
  const parsed = parsePhoneNumberFromString(cleaned, "SN");
  if (!parsed || !parsed.isValid()) return null;
  return parsed.number; // E.164, ex. +221771234567
}

/** Format lisible : +221 77 123 45 67 */
export function formatPhone(e164: string): string {
  const parsed = parsePhoneNumberFromString(e164);
  return parsed ? parsed.formatInternational() : e164;
}
