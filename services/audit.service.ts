import { prisma } from "@/lib/db";
import type { AuditAction } from "@/lib/generated/prisma/enums";
import type { Prisma } from "@/lib/generated/prisma/client";

export interface AuditEntry {
  action: AuditAction;
  entityType: string;
  entityId?: string | null;
  actorId?: string | null;
  ipHash?: string | null;
  /** Métadonnées légères - ne jamais y placer de données personnelles. */
  metadata?: Prisma.InputJsonValue;
}

/**
 * Journalise une action. Ne doit jamais faire échouer l'opération métier :
 * les erreurs de journalisation sont capturées et loguées côté serveur.
 */
export async function audit(entry: AuditEntry, tx?: Prisma.TransactionClient): Promise<void> {
  const client = tx ?? prisma;
  try {
    await client.auditLog.create({
      data: {
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId ?? null,
        actorId: entry.actorId ?? null,
        ipHash: entry.ipHash ?? null,
        metadata: entry.metadata,
      },
    });
  } catch (error) {
    console.error("[audit] échec de journalisation", entry.action, error);
  }
}
