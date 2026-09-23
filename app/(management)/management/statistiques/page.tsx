import type { Metadata } from "next";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarCheck, Clock, TrendingUp, UserMinus, UserRound } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { ChartCard } from "@/components/admin/chart-card";
import { ManagementStatCard } from "@/components/management/management-stat-card";
import {
  AttendanceTrend,
  RateBars,
  StatusBars,
} from "@/components/management/stats/attendance-charts";
import { EmptyState } from "@/components/shared/states";
import { requireManagementPagePermission } from "@/lib/auth/session";
import { getAttendanceStats } from "@/services/management/stats.service";
import { MeetingTypeFilter } from "@/components/management/stats/stats-filters";
import { listCommissions } from "@/services/management/members.service";
import { MeetingType } from "@/lib/generated/prisma/enums";

export const metadata: Metadata = { title: "Statistiques" };

const DATE = /^\d{4}-\d{2}-\d{2}$/;

export default async function ManagementStatsPage(props: PageProps<"/management/statistiques">) {
  await requireManagementPagePermission("management:stats");
  const sp = await props.searchParams;
  const str = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : undefined);

  const type = str("type");
  const filters = {
    from: str("from") && DATE.test(str("from")!) ? new Date(`${str("from")}T00:00:00`) : undefined,
    to: str("to") && DATE.test(str("to")!) ? new Date(`${str("to")}T23:59:59`) : undefined,
    commissionId: str("commissionId"),
    type: type && type in MeetingType ? (type as keyof typeof MeetingType) : undefined,
  };

  const [stats, commissions] = await Promise.all([
    getAttendanceStats(filters),
    listCommissions(),
  ]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Statistiques internes"
        description="L'assiduité du bureau et des commissions, calculée sur les séances réellement pointées."
      />

      <MeetingTypeFilter commissions={commissions} />

      {stats.totals.meetings === 0 ? (
        <EmptyState
          icon={TrendingUp}
          title="Aucune séance à analyser"
          description="Les statistiques apparaîtront dès qu'une réunion terminée aura sa feuille de présence renseignée."
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <ManagementStatCard
              index={0}
              label="Taux moyen de présence"
              value={stats.totals.rate}
              decimals={1}
              suffix=" %"
              icon={TrendingUp}
              accent="cyan"
              emptyLabel="Pas encore mesuré"
            />
            <ManagementStatCard
              index={1}
              label="Séances analysées"
              value={stats.totals.meetings}
              icon={CalendarCheck}
              hint={
                stats.totals.unrecorded > 0
                  ? `${stats.totals.unrecorded} séance(s) non pointée(s), exclue(s)`
                  : "Toutes les séances sont pointées"
              }
            />
            <ManagementStatCard
              index={2}
              label="Présences"
              value={stats.totals.present}
              icon={UserRound}
              accent="green"
            />
            <ManagementStatCard
              index={3}
              label="Retards"
              value={stats.totals.late}
              icon={Clock}
              accent="amber"
            />
            <ManagementStatCard
              index={4}
              label="Absences"
              value={stats.totals.absent}
              icon={UserMinus}
              accent="rose"
              hint={`${stats.totals.excused} excusée(s)`}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard
              title="Évolution du taux de présence"
              description="Par mois, sur les douze derniers mois pointés."
            >
              <AttendanceTrend data={stats.monthly} />
            </ChartCard>
            <ChartCard
              title="Répartition des pointages"
              description="Tous statuts confondus, sur la période filtrée."
            >
              <StatusBars totals={stats.totals} />
            </ChartCard>
            <ChartCard
              title="Présence par commission"
              description="Séances rattachées à chaque commission."
            >
              <RateBars data={stats.byCommission} />
            </ChartCard>
            <ChartCard
              title="Membres les plus assidus"
              description="Taux de présence individuel sur les séances où ils étaient convoqués."
            >
              <RateBars
                data={stats.topMembers.map((m) => ({ name: m.name, rate: m.rate }))}
                color="var(--chart-3)"
              />
            </ChartCard>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard title="Séances les plus suivies">
              <ul className="divide-border divide-y text-sm">
                {stats.topMeetings.map((m) => (
                  <li key={m.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="text-foreground truncate">{m.title}</p>
                      <p className="text-muted-foreground text-xs">
                        {format(m.startsAt, "d MMMM yyyy", { locale: fr })}
                      </p>
                    </div>
                    <span className="text-foreground shrink-0 font-medium tabular-nums">
                      {m.rate} %
                    </span>
                  </li>
                ))}
              </ul>
            </ChartCard>
            <ChartCard
              title="Assiduité à suivre"
              description="Les membres dont le taux est le plus bas, pour relance plutôt que pour sanction."
            >
              <ul className="divide-border divide-y text-sm">
                {stats.lowMembers.map((m) => (
                  <li key={m.name} className="flex items-center justify-between gap-3 py-2.5">
                    <span className="text-foreground truncate">{m.name}</span>
                    <span className="text-muted-foreground shrink-0 tabular-nums">
                      {m.present} / {m.total} · {m.rate} %
                    </span>
                  </li>
                ))}
              </ul>
            </ChartCard>
          </div>
        </>
      )}
    </div>
  );
}
