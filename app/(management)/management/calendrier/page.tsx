import type { Metadata } from "next";
import {
  addDays,
  eachDayOfInterval,
  endOfDay,
  endOfMonth,
  endOfWeek,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { PageHeader } from "@/components/admin/page-header";
import {
  CalendarView,
  type CalendarViewName,
} from "@/components/management/calendar/calendar-view";
import { requireManagementPagePermission } from "@/lib/auth/session";
import { hasManagementPermission } from "@/lib/auth/management-rbac";
import { listMeetingsInRange } from "@/services/management/meetings.service";

export const metadata: Metadata = { title: "Calendrier" };

const VIEWS: CalendarViewName[] = ["mois", "semaine", "jour", "agenda"];
const DATE = /^\d{4}-\d{2}-\d{2}$/;
/** Semaine à la française : elle commence le lundi. */
const WEEK = { weekStartsOn: 1 } as const;

/** Bornes de chargement et jours affichés, selon la vue demandée. */
function rangeFor(view: CalendarViewName, anchor: Date) {
  switch (view) {
    case "jour":
      return { from: startOfDay(anchor), to: endOfDay(anchor), days: [startOfDay(anchor)] };
    case "semaine": {
      const from = startOfWeek(anchor, WEEK);
      const to = endOfWeek(anchor, WEEK);
      return { from, to: endOfDay(to), days: eachDayOfInterval({ start: from, end: to }) };
    }
    case "agenda": {
      const from = startOfDay(new Date());
      const to = endOfDay(addDays(from, 60));
      return { from, to, days: [] };
    }
    default: {
      // La grille mensuelle déborde sur les semaines voisines.
      const from = startOfWeek(startOfMonth(anchor), WEEK);
      const to = endOfWeek(endOfMonth(anchor), WEEK);
      return { from, to: endOfDay(to), days: eachDayOfInterval({ start: from, end: to }) };
    }
  }
}

export default async function CalendarPage(props: PageProps<"/management/calendrier">) {
  const user = await requireManagementPagePermission("meetings:view");
  const sp = await props.searchParams;

  const view: CalendarViewName =
    typeof sp.view === "string" && VIEWS.includes(sp.view as CalendarViewName)
      ? (sp.view as CalendarViewName)
      : "mois";
  const anchor =
    typeof sp.date === "string" && DATE.test(sp.date) ? new Date(`${sp.date}T12:00:00`) : new Date();

  const { from, to, days } = rangeFor(view, anchor);
  const meetings = await listMeetingsInRange(from, to);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Calendrier"
        description="Les séances du bureau et des commissions, vue par mois, semaine, jour ou agenda."
      />

      <CalendarView
        view={view}
        anchor={anchor}
        days={days}
        meetings={meetings}
        canEdit={hasManagementPermission(user.managementRole, "meetings:edit")}
        canCreate={hasManagementPermission(user.managementRole, "meetings:create")}
      />
    </div>
  );
}
