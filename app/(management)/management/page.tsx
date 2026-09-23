import type { Metadata } from "next";
import {
  CalendarCheck,
  CalendarClock,
  CircleAlert,
  CircleCheck,
  FileText,
  History,
  ListChecks,
  UserCheck,
} from "lucide-react";
import { ManagementStatCard } from "@/components/management/management-stat-card";
import {
  ActivityPanel,
  ManagementFooterNote,
  Panel,
  PendingMinutesPanel,
  UpcomingMeetingsPanel,
  WatchedActionsPanel,
} from "@/components/management/dashboard-panels";
import { requireManagementPagePermission } from "@/lib/auth/session";
import {
  getManagementActivity,
  getManagementKpis,
  getPendingMinutes,
  getUpcomingMeetings,
  getWatchedActions,
} from "@/services/management/dashboard.service";
import { ORG_ACRONYM } from "@/lib/constants/app";

export const metadata: Metadata = { title: "Dashboard" };

/** Prénom seul, pour l'accueil. */
function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? "";
}

export default async function ManagementDashboardPage() {
  const user = await requireManagementPagePermission("management:dashboard");

  const [kpis, meetings, actions, minutes, activity] = await Promise.all([
    getManagementKpis(),
    getUpcomingMeetings(),
    getWatchedActions(),
    getPendingMinutes(),
    getManagementActivity(),
  ]);

  return (
    <div className="space-y-6">
      <header className="animate-in fade-in slide-in-from-bottom-1 duration-500 motion-reduce:animate-none">
        <h1 className="text-foreground text-2xl font-semibold sm:text-3xl">
          Bonjour, {firstName(user.name)}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Voici un aperçu de l&apos;activité du {ORG_ACRONYM}.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <ManagementStatCard
          index={0}
          label="Réunions ce mois"
          value={kpis.meetingsThisMonth}
          icon={CalendarClock}
          accent="brand"
          hint="Séances planifiées ou tenues"
        />
        <ManagementStatCard
          index={1}
          label="Taux moyen de présence"
          value={kpis.attendanceRate}
          decimals={1}
          suffix=" %"
          icon={UserCheck}
          accent="cyan"
          hint="Présents et retards sur convoqués"
          emptyLabel="Pas encore mesuré"
        />
        <ManagementStatCard
          index={2}
          label="PV à finaliser"
          value={kpis.minutesToFinalize}
          icon={FileText}
          accent="amber"
          hint={`${kpis.minutesToValidate} en attente de validation`}
        />
        <ManagementStatCard
          index={3}
          label="Actions en cours"
          value={kpis.actionsOpen}
          icon={ListChecks}
          accent="brand"
          hint="À faire, en cours ou bloquées"
        />
        <ManagementStatCard
          index={4}
          label="Actions terminées"
          value={kpis.actionsDone}
          icon={CircleCheck}
          accent="green"
          hint="Depuis le début du suivi"
        />
        <ManagementStatCard
          index={5}
          label="Actions en retard"
          value={kpis.actionsOverdue}
          icon={CircleAlert}
          accent="rose"
          hint="Échéance dépassée"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Prochaines réunions" icon={CalendarCheck} index={0}>
          <UpcomingMeetingsPanel meetings={meetings} />
        </Panel>
        <Panel title="Actions à suivre" icon={ListChecks} index={1}>
          <WatchedActionsPanel actions={actions} />
        </Panel>
        <Panel title="Procès-verbaux à traiter" icon={FileText} index={2}>
          <PendingMinutesPanel minutes={minutes} />
        </Panel>
        <Panel title="Activité récente" icon={History} index={3}>
          <ActivityPanel entries={activity} />
        </Panel>
      </div>

      <ManagementFooterNote />
    </div>
  );
}
