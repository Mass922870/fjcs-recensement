import { addDays, endOfDay, startOfToday } from "date-fns";
import { prisma } from "@/lib/db";
import { isDemoDataVisible } from "@/lib/demo-data";

export interface ManagementAlert {
  id: string;
  title: string;
  description: string;
  href: string;
  tone: "info" | "warning" | "danger";
}

function demoFilter(): { isDemo?: false } {
  return isDemoDataVisible() ? {} : { isDemo: false };
}

const plural = (n: number, one: string, many: string) => (n > 1 ? many : one);

/**
 * Alertes de l'espace interne, recalculées à chaque affichage.
 *
 * Elles ne sont pas stockées : ce sont des vues sur l'état courant, et une
 * table de notifications se désynchroniserait de la réalité au premier oubli
 * de mise à jour. L'architecture reste ouverte à un envoi par courriel ou
 * WhatsApp, qui consommerait cette même fonction.
 */
export async function getManagementAlerts(): Promise<ManagementAlert[]> {
  const today = startOfToday();
  const inAWeek = endOfDay(addDays(today, 7));
  const demo = demoFilter();

  const [upcoming, draftMinutes, toValidate, dueSoon, overdue] = await Promise.all([
    prisma.meeting.count({
      where: { ...demo, status: "PLANIFIEE", startsAt: { gte: today, lte: inAWeek } },
    }),
    prisma.minutes.count({
      where: { status: { in: ["BROUILLON", "EN_REVISION"] }, meeting: demo },
    }),
    prisma.minutes.count({ where: { status: "A_VALIDER", meeting: demo } }),
    prisma.actionItem.count({
      where: {
        ...demo,
        status: { in: ["A_FAIRE", "EN_COURS", "BLOQUE"] },
        dueDate: { gte: today, lte: inAWeek },
      },
    }),
    prisma.actionItem.count({
      where: {
        ...demo,
        status: { in: ["A_FAIRE", "EN_COURS", "BLOQUE"] },
        dueDate: { lt: today },
      },
    }),
  ]);

  const alerts: ManagementAlert[] = [];

  if (overdue > 0) {
    alerts.push({
      id: "actions-overdue",
      title: `${overdue} ${plural(overdue, "action est en retard", "actions sont en retard")}`,
      description: "Leur échéance est dépassée et elles ne sont pas terminées.",
      href: "/management/actions?due=retard",
      tone: "danger",
    });
  }
  if (dueSoon > 0) {
    alerts.push({
      id: "actions-due",
      title: `${dueSoon} ${plural(dueSoon, "action arrive", "actions arrivent")} à échéance cette semaine`,
      description: "À traiter avant la prochaine séance.",
      href: "/management/actions?due=semaine",
      tone: "warning",
    });
  }
  if (toValidate > 0) {
    alerts.push({
      id: "minutes-validate",
      title: `${toValidate} ${plural(toValidate, "procès-verbal attend", "procès-verbaux attendent")} validation`,
      description: "La présidence doit se prononcer pour figer la version.",
      href: "/management/proces-verbaux",
      tone: "warning",
    });
  }
  if (draftMinutes > 0) {
    alerts.push({
      id: "minutes-draft",
      title: `${draftMinutes} ${plural(draftMinutes, "procès-verbal reste à finaliser", "procès-verbaux restent à finaliser")}`,
      description: "Ils sont encore en brouillon ou en révision.",
      href: "/management/proces-verbaux",
      tone: "info",
    });
  }
  if (upcoming > 0) {
    alerts.push({
      id: "meetings-upcoming",
      title: `${upcoming} ${plural(upcoming, "réunion est prévue", "réunions sont prévues")} cette semaine`,
      description: "Pensez aux convocations et à l'ordre du jour.",
      href: "/management/calendrier?view=semaine",
      tone: "info",
    });
  }

  return alerts;
}
