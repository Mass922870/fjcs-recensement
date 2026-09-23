import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ChevronRight, MapPin, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  MEETING_STATUS_LABELS,
  MEETING_STATUS_STYLES,
  MEETING_TYPE_LABELS,
} from "@/lib/constants/management";
import type { MeetingRow } from "@/services/management/meetings.service";
import { cn } from "@/lib/utils";

export function MeetingStatusBadge({ status }: { status: MeetingRow["status"] }) {
  return (
    <Badge variant="outline" className={cn(MEETING_STATUS_STYLES[status])}>
      {MEETING_STATUS_LABELS[status]}
    </Badge>
  );
}

export function MeetingsTable({ meetings }: { meetings: MeetingRow[] }) {
  return (
    <>
      <div className="border-border hidden overflow-hidden rounded-2xl border bg-white md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Réunion</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Organisateur</TableHead>
              <TableHead>Convoqués</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {meetings.map((m) => (
              <TableRow key={m.id} className="hover:bg-muted/40 transition-colors">
                <TableCell>
                  <Link href={`/management/reunions/${m.id}`} className="block">
                    <p className="text-foreground font-medium">{m.title}</p>
                    <p className="text-muted-foreground font-mono text-xs">{m.reference}</p>
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  <p>{format(m.startsAt, "d MMM yyyy", { locale: fr })}</p>
                  <p className="text-xs">{format(m.startsAt, "HH'h'mm", { locale: fr })}</p>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  <p>{MEETING_TYPE_LABELS[m.type]}</p>
                  {m.commission ? <p className="text-xs">{m.commission.name}</p> : null}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {m.organizer ? `${m.organizer.lastName} ${m.organizer.firstName}` : "—"}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm tabular-nums">
                  {m._count.participants}
                </TableCell>
                <TableCell>
                  <MeetingStatusBadge status={m.status} />
                </TableCell>
                <TableCell>
                  <Link
                    href={`/management/reunions/${m.id}`}
                    aria-label={`Ouvrir ${m.title}`}
                    className="text-muted-foreground hover:text-foreground block"
                  >
                    <ChevronRight className="size-4" />
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ul className="space-y-3 md:hidden">
        {meetings.map((m) => (
          <li key={m.id}>
            <Link
              href={`/management/reunions/${m.id}`}
              className="border-border block rounded-2xl border bg-white p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-foreground font-medium">{m.title}</p>
                  <p className="text-muted-foreground mt-0.5 text-xs">
                    {format(m.startsAt, "EEEE d MMMM yyyy 'à' HH'h'mm", { locale: fr })}
                  </p>
                </div>
                <MeetingStatusBadge status={m.status} />
              </div>
              <div className="text-muted-foreground mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                <span>{MEETING_TYPE_LABELS[m.type]}</span>
                {m.location ? (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="size-3" aria-hidden />
                    {m.location}
                  </span>
                ) : null}
                <span className="inline-flex items-center gap-1">
                  <Users className="size-3" aria-hidden />
                  {m._count.participants}
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
