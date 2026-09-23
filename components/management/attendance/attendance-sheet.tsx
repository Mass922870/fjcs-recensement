"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCheck, Loader2, QrCode, Save, UserX } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/states";
import { ATTENDANCE_STATUS_LABELS } from "@/lib/constants/management";
import type { AttendanceStatus } from "@/lib/generated/prisma/enums";
import { saveAttendancesAction } from "@/actions/management/attendance";
import type { AttendanceSheet } from "@/services/management/attendance.service";
import { cn } from "@/lib/utils";

const STATUSES: AttendanceStatus[] = ["PRESENT", "RETARD", "EXCUSE", "ABSENT"];

const STATUS_STYLES: Record<AttendanceStatus, string> = {
  PRESENT: "data-[on=true]:bg-green-600 data-[on=true]:text-white",
  RETARD: "data-[on=true]:bg-amber-500 data-[on=true]:text-white",
  EXCUSE: "data-[on=true]:bg-cyan-600 data-[on=true]:text-white",
  ABSENT: "data-[on=true]:bg-rose-600 data-[on=true]:text-white",
};

interface Draft {
  status: AttendanceStatus | null;
  arrivedAt: string;
  leftAt: string;
  comment: string;
  /** Vrai si la ligne vient d'un pointage par QR non encore corrigé. */
  fromQr: boolean;
}

function hhmm(date: Date | null): string {
  if (!date) return "";
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

export function AttendanceSheetEditor({
  sheet,
  canManage,
}: {
  sheet: AttendanceSheet;
  canManage: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [drafts, setDrafts] = useState<Record<string, Draft>>(() =>
    Object.fromEntries(
      sheet.rows.map((r) => [
        r.member.id,
        {
          status: r.attendance?.status ?? null,
          arrivedAt: hhmm(r.attendance?.arrivedAt ?? null),
          leftAt: hhmm(r.attendance?.leftAt ?? null),
          comment: r.attendance?.comment ?? "",
          fromQr: r.attendance?.method === "QR_CODE",
        },
      ]),
    ),
  );

  const update = (memberId: string, patch: Partial<Draft>) =>
    setDrafts((d) => ({ ...d, [memberId]: { ...d[memberId]!, ...patch } }));

  const setAll = (status: AttendanceStatus) =>
    setDrafts((d) =>
      Object.fromEntries(Object.entries(d).map(([id, draft]) => [id, { ...draft, status }])),
    );

  const save = () => {
    const entries = Object.entries(drafts)
      .filter(([, d]) => d.status !== null)
      .map(([memberId, d]) => ({
        memberId,
        status: d.status,
        arrivedAt: d.arrivedAt,
        leftAt: d.leftAt,
        comment: d.comment,
      }));
    if (entries.length === 0) {
      toast.error("Renseignez au moins une présence.");
      return;
    }
    start(async () => {
      const res = await saveAttendancesAction(sheet.meeting.id, { entries });
      if (res.ok) {
        toast.success("Feuille de présence enregistrée.");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  };

  if (sheet.rows.length === 0) {
    return (
      <EmptyState
        icon={UserX}
        title="Aucun membre convoqué"
        description="Ajoutez des participants à la réunion avant de pointer les présences."
      />
    );
  }

  const marked = Object.values(drafts).filter((d) => d.status !== null).length;

  return (
    <div className="space-y-4">
      {canManage ? (
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setAll("PRESENT")}>
            <CheckCheck />
            Tout marquer présent
          </Button>
          <Button variant="outline" size="sm" onClick={() => setAll("ABSENT")}>
            <UserX />
            Tout marquer absent
          </Button>
          <span className="text-muted-foreground ml-auto text-sm">
            {marked} / {sheet.rows.length} renseignés
          </span>
        </div>
      ) : null}

      <ul className="border-border divide-border divide-y overflow-hidden rounded-2xl border bg-white">
        {sheet.rows.map((row) => {
          const draft = drafts[row.member.id]!;
          return (
            <li key={row.member.id} className="p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0 lg:w-56">
                  <p className="text-foreground truncate text-sm font-medium">
                    {row.member.lastName} {row.member.firstName}
                  </p>
                  <p className="text-muted-foreground truncate text-xs">
                    {row.member.role ?? "Membre"}
                    {row.member.commission ? ` · ${row.member.commission.name}` : ""}
                  </p>
                  {draft.fromQr ? (
                    <Badge variant="secondary" className="mt-1 gap-1 text-[10px]">
                      <QrCode className="size-2.5" />
                      pointé par QR
                    </Badge>
                  ) : null}
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  {STATUSES.map((status) => (
                    <button
                      key={status}
                      type="button"
                      disabled={!canManage}
                      data-on={draft.status === status}
                      aria-pressed={draft.status === status}
                      onClick={() => update(row.member.id, { status })}
                      className={cn(
                        "border-border rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors",
                        "hover:bg-muted disabled:cursor-default disabled:opacity-60",
                        STATUS_STYLES[status],
                      )}
                    >
                      {ATTENDANCE_STATUS_LABELS[status]}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <Input
                    type="time"
                    value={draft.arrivedAt}
                    disabled={!canManage}
                    onChange={(e) => update(row.member.id, { arrivedAt: e.target.value })}
                    aria-label={`Heure d'arrivée de ${row.member.lastName}`}
                    className="w-28"
                  />
                  <span className="text-muted-foreground text-xs">→</span>
                  <Input
                    type="time"
                    value={draft.leftAt}
                    disabled={!canManage}
                    onChange={(e) => update(row.member.id, { leftAt: e.target.value })}
                    aria-label={`Heure de départ de ${row.member.lastName}`}
                    className="w-28"
                  />
                </div>
              </div>

              {canManage && draft.status === "EXCUSE" ? (
                <Input
                  value={draft.comment}
                  onChange={(e) => update(row.member.id, { comment: e.target.value })}
                  placeholder="Motif de l'excuse (facultatif)"
                  aria-label={`Motif pour ${row.member.lastName}`}
                  className="mt-3"
                />
              ) : null}
            </li>
          );
        })}
      </ul>

      {canManage ? (
        <div className="flex justify-end">
          <Button onClick={save} disabled={pending}>
            {pending ? <Loader2 data-icon="inline-start" className="animate-spin" /> : <Save />}
            Enregistrer la feuille
          </Button>
        </div>
      ) : null}
    </div>
  );
}
