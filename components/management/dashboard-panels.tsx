import Link from "next/link";
import { format, formatDistanceToNow, isToday, isTomorrow } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarClock, FileText, History, ListChecks, MapPin, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/states";
import {
  ACTION_PRIORITY_LABELS,
  ACTION_PRIORITY_STYLES,
  MEETING_TYPE_LABELS,
  MINUTES_STATUS_LABELS,
} from "@/lib/constants/management";
import type {
  ActivityEntry,
  PendingMinutes,
  UpcomingMeeting,
  WatchedAction,
} from "@/services/management/dashboard.service";
import type {
  ActionPriority,
  MeetingType,
  MinutesStatus,
} from "@/lib/generated/prisma/enums";
import { cn } from "@/lib/utils";

export function Panel({
  title,
  icon: Icon,
  children,
  index = 0,
}: {
  title: string;
  icon: typeof CalendarClock;
  children: React.ReactNode;
  index?: number;
}) {
  return (
    <section
      style={{ animationDelay: `${180 + index * 90}ms` }}
      className="border-border animate-in fade-in slide-in-from-bottom-2 fill-mode-backwards rounded-2xl border bg-white duration-500 motion-reduce:animate-none"
    >
      <header className="border-border flex items-center gap-2 border-b px-5 py-3.5">
        <Icon className="text-muted-foreground size-4" aria-hidden />
        <h2 className="text-foreground text-sm font-semibold">{title}</h2>
      </header>
      <div className="p-5">{children}</div>
    </section>
  );
}

/** « Aujourd'hui à 15h00 », « demain à 09h30 », sinon la date complète. */
function whenLabel(date: Date): string {
  const time = format(date, "HH'h'mm", { locale: fr });
  if (isToday(date)) return `Aujourd'hui à ${time}`;
  if (isTomorrow(date)) return `Demain à ${time}`;
  return `${format(date, "EEEE d MMMM", { locale: fr })} à ${time}`;
}

export function UpcomingMeetingsPanel({ meetings }: { meetings: UpcomingMeeting[] }) {
  if (!meetings.length) {
    return (
      <EmptyState
        icon={CalendarClock}
        title="Aucune réunion planifiée"
        description="Les prochaines séances du bureau et des commissions apparaîtront ici."
        className="border-0 bg-transparent py-8"
      />
    );
  }

  return (
    <ul className="divide-border -my-2 divide-y">
      {meetings.map((m) => (
        <li key={m.id} className="flex items-start gap-3 py-3">
          <span className="bg-brand-50 text-brand-700 mt-0.5 flex size-9 shrink-0 flex-col items-center justify-center rounded-lg text-[10px] leading-none font-semibold">
            <span className="text-sm">{format(m.startsAt, "d")}</span>
            <span className="uppercase">{format(m.startsAt, "MMM", { locale: fr })}</span>
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-foreground truncate text-sm font-medium">{m.title}</p>
            <p className="text-muted-foreground mt-0.5 text-xs">
              {whenLabel(m.startsAt)} · {MEETING_TYPE_LABELS[m.type as MeetingType]}
            </p>
            <div className="text-muted-foreground mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
              {m.location ? (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="size-3" aria-hidden />
                  {m.location}
                </span>
              ) : null}
              <span className="inline-flex items-center gap-1">
                <Users className="size-3" aria-hidden />
                {m.participantCount} convoqué{m.participantCount > 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function WatchedActionsPanel({ actions }: { actions: WatchedAction[] }) {
  if (!actions.length) {
    return (
      <EmptyState
        icon={ListChecks}
        title="Tout est à jour"
        description="Aucune action n'arrive à échéance dans les deux prochaines semaines."
        className="border-0 bg-transparent py-8"
      />
    );
  }

  return (
    <ul className="divide-border -my-2 divide-y">
      {actions.map((a) => (
        <li key={a.id} className="flex items-start justify-between gap-3 py-3">
          <div className="min-w-0 flex-1">
            <p className="text-foreground truncate text-sm font-medium">{a.title}</p>
            <p className="text-muted-foreground mt-0.5 text-xs">
              {a.assignee ?? "Non assignée"}
              {a.dueDate ? (
                <>
                  {" · "}
                  <span className={cn(a.overdue && "text-destructive font-medium")}>
                    {a.overdue ? "en retard depuis le " : "échéance "}
                    {format(a.dueDate, "d MMMM", { locale: fr })}
                  </span>
                </>
              ) : null}
            </p>
          </div>
          <Badge
            variant="outline"
            className={cn("shrink-0", ACTION_PRIORITY_STYLES[a.priority as ActionPriority])}
          >
            {ACTION_PRIORITY_LABELS[a.priority as ActionPriority]}
          </Badge>
        </li>
      ))}
    </ul>
  );
}

export function PendingMinutesPanel({ minutes }: { minutes: PendingMinutes[] }) {
  if (!minutes.length) {
    return (
      <EmptyState
        icon={FileText}
        title="Aucun procès-verbal en attente"
        description="Les comptes rendus à rédiger ou à valider s'afficheront ici."
        className="border-0 bg-transparent py-8"
      />
    );
  }

  return (
    <ul className="divide-border -my-2 divide-y">
      {minutes.map((m) => (
        <li key={m.id} className="flex items-start justify-between gap-3 py-3">
          <div className="min-w-0 flex-1">
            <p className="text-foreground truncate text-sm font-medium">{m.meetingTitle}</p>
            <p className="text-muted-foreground mt-0.5 text-xs">
              Séance du {format(m.meetingDate, "d MMMM yyyy", { locale: fr })}
            </p>
          </div>
          <Badge variant="secondary" className="shrink-0">
            {MINUTES_STATUS_LABELS[m.status as MinutesStatus]}
          </Badge>
        </li>
      ))}
    </ul>
  );
}

export function ActivityPanel({ entries }: { entries: ActivityEntry[] }) {
  if (!entries.length) {
    return (
      <EmptyState
        icon={History}
        title="Aucune activité pour l'instant"
        description="Chaque action du bureau sera consignée ici, avec son auteur et sa date."
        className="border-0 bg-transparent py-8"
      />
    );
  }

  return (
    <ol className="space-y-4">
      {entries.map((e) => (
        <li key={e.id} className="flex gap-3">
          <span className="bg-border relative mt-1 flex w-px justify-center">
            <span className="bg-cyan-500 absolute -top-0.5 size-2 rounded-full" />
          </span>
          <div className="min-w-0 flex-1 pb-0.5">
            <p className="text-foreground text-sm">
              <span className="font-medium">{e.actor ?? "Un membre"}</span> {e.label}
            </p>
            <p className="text-muted-foreground text-xs">
              {formatDistanceToNow(e.createdAt, { addSuffix: true, locale: fr })}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}

export function ManagementFooterNote() {
  return (
    <p className="text-muted-foreground text-center text-xs">
      Espace interne du FJCS · toute action est journalisée.{" "}
      <Link href="/admin" className="underline underline-offset-4">
        Revenir à l&apos;espace jeunesse
      </Link>
    </p>
  );
}
