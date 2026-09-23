"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  addDays,
  addMonths,
  addWeeks,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfWeek,
} from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarPlus, ChevronLeft, ChevronRight, MapPin, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/states";
import { MEETING_STATUS_LABELS, MEETING_TYPE_DOT, MEETING_TYPE_LABELS } from "@/lib/constants/management";
import { rescheduleMeetingAction } from "@/actions/management/meetings";
import type { CalendarMeeting } from "@/services/management/meetings.service";
import { cn } from "@/lib/utils";

export type CalendarViewName = "mois" | "semaine" | "jour" | "agenda";

const VIEWS: { value: CalendarViewName; label: string }[] = [
  { value: "mois", label: "Mois" },
  { value: "semaine", label: "Semaine" },
  { value: "jour", label: "Jour" },
  { value: "agenda", label: "Agenda" },
];

interface Props {
  view: CalendarViewName;
  anchor: Date;
  days: Date[];
  meetings: CalendarMeeting[];
  canEdit: boolean;
  canCreate: boolean;
}

function isoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

function title(view: CalendarViewName, anchor: Date): string {
  if (view === "jour") return format(anchor, "EEEE d MMMM yyyy", { locale: fr });
  if (view === "semaine") {
    const start = startOfWeek(anchor, { weekStartsOn: 1 });
    const end = endOfWeek(anchor, { weekStartsOn: 1 });
    return `${format(start, "d MMM", { locale: fr })} — ${format(end, "d MMM yyyy", { locale: fr })}`;
  }
  if (view === "agenda") return "Prochaines séances";
  return format(anchor, "MMMM yyyy", { locale: fr });
}

function shift(view: CalendarViewName, anchor: Date, direction: 1 | -1): Date {
  if (view === "jour") return addDays(anchor, direction);
  if (view === "semaine") return addWeeks(anchor, direction);
  return addMonths(anchor, direction);
}

export function CalendarView({ view, anchor, days, meetings, canEdit, canCreate }: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [dragId, setDragId] = useState<string | null>(null);
  const [overDay, setOverDay] = useState<string | null>(null);

  const go = (date: Date, nextView: CalendarViewName = view) =>
    router.push(`/management/calendrier?view=${nextView}&date=${isoDate(date)}`);

  const meetingsOn = (day: Date) => meetings.filter((m) => isSameDay(m.startsAt, day));

  const drop = (day: Date) => {
    const id = dragId;
    setDragId(null);
    setOverDay(null);
    if (!id) return;
    const meeting = meetings.find((m) => m.id === id);
    if (!meeting || isSameDay(meeting.startsAt, day)) return;
    start(async () => {
      const res = await rescheduleMeetingAction(id, { date: isoDate(day) });
      if (res.ok) {
        toast.success(`Réunion déplacée au ${format(day, "d MMMM", { locale: fr })}.`);
        router.refresh();
      } else {
        toast.error(res.error ?? "Déplacement impossible.");
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="border-border flex flex-col gap-3 rounded-2xl border bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          {view !== "agenda" ? (
            <>
              <Button
                variant="outline"
                size="icon"
                aria-label="Période précédente"
                onClick={() => go(shift(view, anchor, -1))}
              >
                <ChevronLeft />
              </Button>
              <Button
                variant="outline"
                size="icon"
                aria-label="Période suivante"
                onClick={() => go(shift(view, anchor, 1))}
              >
                <ChevronRight />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => go(new Date())}>
                Aujourd&apos;hui
              </Button>
            </>
          ) : null}
          <h2 className="text-foreground ml-1 text-base font-semibold first-letter:uppercase">
            {title(view, anchor)}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="border-border flex rounded-lg border p-0.5">
            {VIEWS.map((v) => (
              <Link
                key={v.value}
                href={`/management/calendrier?view=${v.value}&date=${isoDate(anchor)}`}
                className={cn(
                  "rounded-md px-3 py-1 text-sm transition-colors",
                  v.value === view
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {v.label}
              </Link>
            ))}
          </div>
          {canCreate ? (
            <Button asChild size="sm">
              <Link href={`/management/reunions/nouvelle?date=${isoDate(anchor)}`}>
                <Plus />
                Planifier
              </Link>
            </Button>
          ) : null}
        </div>
      </div>

      {view === "mois" ? (
        <div className="border-border overflow-hidden rounded-2xl border bg-white">
          <div className="border-border text-muted-foreground grid grid-cols-7 border-b text-xs font-medium">
            {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((d) => (
              <div key={d} className="px-2 py-2 text-center">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {days.map((day) => {
              const dayMeetings = meetingsOn(day);
              const key = isoDate(day);
              return (
                <div
                  key={key}
                  onDragOver={(e) => {
                    if (!canEdit) return;
                    e.preventDefault();
                    setOverDay(key);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    drop(day);
                  }}
                  className={cn(
                    "border-border min-h-24 border-r border-b p-1.5 transition-colors last:border-r-0",
                    !isSameMonth(day, anchor) && "bg-muted/30",
                    overDay === key && "bg-brand-50",
                  )}
                >
                  <div className="mb-1 flex items-center justify-between">
                    <span
                      className={cn(
                        "flex size-6 items-center justify-center rounded-full text-xs",
                        isToday(day)
                          ? "bg-primary text-primary-foreground font-semibold"
                          : isSameMonth(day, anchor)
                            ? "text-foreground"
                            : "text-muted-foreground",
                      )}
                    >
                      {format(day, "d")}
                    </span>
                    {canCreate ? (
                      <Link
                        href={`/management/reunions/nouvelle?date=${key}`}
                        aria-label={`Planifier une réunion le ${format(day, "d MMMM", { locale: fr })}`}
                        className="text-muted-foreground hover:text-foreground opacity-0 transition-opacity focus:opacity-100 [div:hover>div>&]:opacity-100"
                      >
                        <CalendarPlus className="size-3.5" />
                      </Link>
                    ) : null}
                  </div>
                  <ul className="space-y-1">
                    {dayMeetings.map((m) => (
                      <li key={m.id}>
                        <Link
                          href={`/management/reunions/${m.id}`}
                          draggable={canEdit}
                          onDragStart={() => setDragId(m.id)}
                          onDragEnd={() => {
                            setDragId(null);
                            setOverDay(null);
                          }}
                          className={cn(
                            "bg-muted/60 hover:bg-muted flex items-center gap-1 rounded px-1.5 py-1 text-[11px] transition-colors",
                            canEdit && "cursor-grab active:cursor-grabbing",
                            m.status === "ANNULEE" && "line-through opacity-60",
                            dragId === m.id && "opacity-40",
                          )}
                        >
                          <span
                            className={cn("size-1.5 shrink-0 rounded-full", MEETING_TYPE_DOT[m.type])}
                            aria-hidden
                          />
                          <span className="text-muted-foreground shrink-0 tabular-nums">
                            {format(m.startsAt, "HH'h'mm")}
                          </span>
                          <span className="truncate">{m.title}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {view === "semaine" ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-7">
          {days.map((day) => {
            const dayMeetings = meetingsOn(day);
            return (
              <div
                key={isoDate(day)}
                className={cn(
                  "border-border rounded-xl border bg-white p-3",
                  isToday(day) && "ring-primary/40 ring-2",
                )}
              >
                <p className="text-muted-foreground text-xs font-medium first-letter:uppercase">
                  {format(day, "EEEE d", { locale: fr })}
                </p>
                <ul className="mt-2 space-y-2">
                  {dayMeetings.map((m) => (
                    <li key={m.id}>
                      <MeetingChip meeting={m} />
                    </li>
                  ))}
                  {dayMeetings.length === 0 ? (
                    <li className="text-muted-foreground text-xs">—</li>
                  ) : null}
                </ul>
              </div>
            );
          })}
        </div>
      ) : null}

      {view === "jour" ? (
        <div className="border-border rounded-2xl border bg-white p-5">
          {meetingsOn(anchor).length === 0 ? (
            <EmptyState
              title="Aucune séance ce jour-là"
              description="Utilisez « Planifier » pour ajouter une réunion à cette date."
              className="border-0 bg-transparent py-8"
            />
          ) : (
            <ul className="divide-border divide-y">
              {meetingsOn(anchor).map((m) => (
                <li key={m.id} className="py-3 first:pt-0 last:pb-0">
                  <MeetingChip meeting={m} detailed />
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}

      {view === "agenda" ? (
        <div className="border-border rounded-2xl border bg-white p-5">
          {meetings.length === 0 ? (
            <EmptyState
              title="Aucune séance à venir"
              description="Les deux prochains mois ne comportent aucune réunion planifiée."
              className="border-0 bg-transparent py-8"
            />
          ) : (
            <ol className="space-y-5">
              {groupByDay(meetings).map(([day, items]) => (
                <li key={day}>
                  <p className="text-muted-foreground mb-2 text-xs font-medium tracking-wide uppercase">
                    {format(new Date(day), "EEEE d MMMM yyyy", { locale: fr })}
                  </p>
                  <ul className="divide-border divide-y">
                    {items.map((m) => (
                      <li key={m.id} className="py-2.5 first:pt-0 last:pb-0">
                        <MeetingChip meeting={m} detailed />
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ol>
          )}
        </div>
      ) : null}

      {canEdit && view === "mois" ? (
        <p className="text-muted-foreground text-center text-xs">
          Faites glisser une réunion sur un autre jour pour la déplacer. L&apos;horaire est
          conservé{pending ? " · déplacement en cours…" : ""}.
        </p>
      ) : null}
    </div>
  );
}

function groupByDay(meetings: CalendarMeeting[]): [string, CalendarMeeting[]][] {
  const groups = new Map<string, CalendarMeeting[]>();
  for (const m of meetings) {
    const key = isoDate(m.startsAt);
    groups.set(key, [...(groups.get(key) ?? []), m]);
  }
  return [...groups.entries()];
}

function MeetingChip({ meeting, detailed }: { meeting: CalendarMeeting; detailed?: boolean }) {
  return (
    <Link
      href={`/management/reunions/${meeting.id}`}
      className="hover:bg-muted/40 -mx-2 flex items-start gap-2.5 rounded-lg px-2 py-1.5 transition-colors"
    >
      <span
        className={cn("mt-1.5 size-2 shrink-0 rounded-full", MEETING_TYPE_DOT[meeting.type])}
        aria-hidden
      />
      <span className="min-w-0 flex-1">
        <span className="text-foreground block truncate text-sm font-medium">
          {meeting.title}
        </span>
        <span className="text-muted-foreground mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs">
          <span className="tabular-nums">
            {format(meeting.startsAt, "HH'h'mm")}
            {meeting.endsAt ? ` — ${format(meeting.endsAt, "HH'h'mm")}` : ""}
          </span>
          {detailed ? <span>{MEETING_TYPE_LABELS[meeting.type]}</span> : null}
          {detailed && meeting.location ? (
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3" aria-hidden />
              {meeting.location}
            </span>
          ) : null}
        </span>
      </span>
      {meeting.status !== "PLANIFIEE" ? (
        <Badge variant="secondary" className="shrink-0 text-[10px]">
          {MEETING_STATUS_LABELS[meeting.status]}
        </Badge>
      ) : null}
    </Link>
  );
}
