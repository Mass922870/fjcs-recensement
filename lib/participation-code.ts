import { customAlphabet } from "nanoid";

// Alphabet sans caractères ambigus (0/O, 1/I/L).
const alphabet = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
const generate = customAlphabet(alphabet, 6);

/** Identifiant de participation non sensible, ex. FJCS-7K3M9Q */
export function generateParticipationCode(): string {
  return `FJCS-${generate()}`;
}

export const PARTICIPATION_CODE_REGEX = /^FJCS-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{6}$/;
