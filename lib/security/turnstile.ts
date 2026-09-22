/**
 * Vérification Cloudflare Turnstile - active uniquement si les clés sont
 * configurées (voir .env.example). Sans clés, la fonction retourne true.
 */
import { getEnv } from "@/lib/env";

export function isTurnstileEnabled(): boolean {
  return Boolean(getEnv("TURNSTILE_SECRET_KEY") && process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);
}

export async function verifyTurnstile(token: string | undefined, ip: string): Promise<boolean> {
  if (!isTurnstileEnabled()) return true;
  if (!token) return false;
  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        secret: getEnv("TURNSTILE_SECRET_KEY"),
        response: token,
        remoteip: ip,
      }),
    });
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}
