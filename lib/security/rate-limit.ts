import { prisma } from "@/lib/db";

export interface RateLimitOptions {
  /** Nombre maximal de requêtes dans la fenêtre. */
  limit: number;
  /** Durée de la fenêtre en secondes. */
  windowSeconds: number;
}

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  /** Secondes avant réinitialisation. */
  retryAfterSeconds: number;
}

/**
 * Rate limiting à fenêtre fixe, persisté en base (table RateLimitBucket) :
 * fonctionne à l'identique en mono-instance, multi-instances et serverless.
 * Une implémentation Redis pourra remplacer ce store sans changer l'interface.
 */
export async function rateLimit(
  scope: string,
  identifier: string,
  { limit, windowSeconds }: RateLimitOptions,
): Promise<RateLimitResult> {
  const key = `${scope}:${identifier}`;
  const now = new Date();
  const resetAt = new Date(now.getTime() + windowSeconds * 1000);

  const bucket = await prisma.$transaction(async (tx) => {
    const existing = await tx.rateLimitBucket.findUnique({ where: { key } });
    if (!existing || existing.resetAt <= now) {
      return tx.rateLimitBucket.upsert({
        where: { key },
        update: { count: 1, resetAt },
        create: { key, count: 1, resetAt },
      });
    }
    return tx.rateLimitBucket.update({
      where: { key },
      data: { count: { increment: 1 } },
    });
  });

  const retryAfterSeconds = Math.max(
    0,
    Math.ceil((bucket.resetAt.getTime() - now.getTime()) / 1000),
  );
  return {
    ok: bucket.count <= limit,
    remaining: Math.max(0, limit - bucket.count),
    retryAfterSeconds,
  };
}

/** Nettoyage opportuniste des compteurs expirés (appelé occasionnellement). */
export async function purgeExpiredBuckets(): Promise<number> {
  const res = await prisma.rateLimitBucket.deleteMany({ where: { resetAt: { lt: new Date() } } });
  return res.count;
}
