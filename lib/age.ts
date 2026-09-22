import { AGE_BRACKETS, type AgeBracketKey } from "@/lib/constants/referentials";

export function computeAge(birthDate: Date, at: Date = new Date()): number {
  let age = at.getFullYear() - birthDate.getFullYear();
  const m = at.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && at.getDate() < birthDate.getDate())) age--;
  return age;
}

export function ageBracketOf(age: number): AgeBracketKey {
  const bracket = AGE_BRACKETS.find((b) => age >= b.min && age <= b.max);
  return bracket?.key ?? "36+";
}

/** Bornes de dates de naissance correspondant à une tranche d'âge (pour les requêtes SQL). */
export function birthDateRangeForBracket(
  key: AgeBracketKey,
  at: Date = new Date(),
): { gte: Date; lte: Date } {
  const b = AGE_BRACKETS.find((x) => x.key === key) ?? AGE_BRACKETS[AGE_BRACKETS.length - 1];
  // âge max → né après (at - (max+1) ans) ; âge min → né avant (at - min ans)
  const gte = new Date(at);
  gte.setFullYear(at.getFullYear() - b.max - 1);
  gte.setDate(gte.getDate() + 1);
  const lte = new Date(at);
  lte.setFullYear(at.getFullYear() - b.min);
  return { gte, lte };
}
