import { createHash } from "node:crypto";
import { headers } from "next/headers";

/** IP du client (derrière proxy : premier X-Forwarded-For). */
export async function getClientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return h.get("x-real-ip") ?? "0.0.0.0";
}

export async function getUserAgent(): Promise<string | null> {
  const h = await headers();
  const ua = h.get("user-agent");
  return ua ? ua.slice(0, 250) : null;
}

/**
 * Hash salé d'une IP : permet le rate limiting et la traçabilité sans stocker
 * l'adresse en clair (aucune donnée personnelle dans les journaux).
 */
export function hashIp(ip: string): string {
  const salt = process.env.IP_HASH_SALT ?? "";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 32);
}

export async function getHashedClientIp(): Promise<string> {
  return hashIp(await getClientIp());
}
