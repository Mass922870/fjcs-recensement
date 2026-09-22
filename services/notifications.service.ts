import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { prisma } from "@/lib/db";
import type { NotificationItem } from "@/components/admin/notifications-menu";

/**
 * Notifications dérivées du journal d'audit (aucune donnée personnelle) :
 * nouvelles inscriptions, exports, rapports.
 */
export async function getRecentNotifications(limit = 6): Promise<NotificationItem[]> {
  const logs = await prisma.auditLog.findMany({
    where: { action: { in: ["PROFILE_CREATED", "EXPORT_GENERATED", "REPORT_GENERATED"] } },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { actor: { select: { name: true } } },
  });

  return logs.map((log) => {
    const time = formatDistanceToNow(log.createdAt, { addSuffix: true, locale: fr });
    switch (log.action) {
      case "PROFILE_CREATED":
        return {
          id: log.id,
          title: "Nouvelle inscription",
          description: "Un jeune vient de compléter le recensement.",
          href: log.entityId ? `/admin/jeunes/${log.entityId}` : "/admin/jeunes",
          time,
        };
      case "EXPORT_GENERATED":
        return {
          id: log.id,
          title: "Export généré",
          description: `Par ${log.actor?.name ?? "un administrateur"}.`,
          href: "/admin/journal-audit",
          time,
        };
      default:
        return {
          id: log.id,
          title: "Rapport généré",
          description: `Par ${log.actor?.name ?? "un administrateur"}.`,
          href: "/admin/journal-audit",
          time,
        };
    }
  });
}
