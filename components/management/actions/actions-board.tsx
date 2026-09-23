"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  AlertTriangle,
  CalendarClock,
  GripVertical,
  KanbanSquare,
  ListChecks,
  MoreHorizontal,
  Pencil,
  Table2,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/states";
import { ActionFormDialog } from "./action-form-dialog";
import {
  ACTION_PRIORITY_LABELS,
  ACTION_PRIORITY_STYLES,
  ACTION_STATUS_LABELS,
  KANBAN_COLUMNS,
} from "@/lib/constants/management";
import { deleteActionAction, moveActionAction } from "@/actions/management/actions";
import type { ActionRow } from "@/services/management/actions.service";
import type { ActionStatus } from "@/lib/generated/prisma/enums";
import type { CommissionRow } from "@/services/management/members.service";
import type { SelectableMember } from "@/services/management/meetings.service";
import { cn } from "@/lib/utils";

const COLUMN_TONES: Record<ActionStatus, string> = {
  A_FAIRE: "border-t-slate-400",
  EN_COURS: "border-t-brand-500",
  BLOQUE: "border-t-rose-500",
  TERMINE: "border-t-green-500",
};

interface Props {
  actions: ActionRow[];
  members: SelectableMember[];
  commissions: CommissionRow[];
  view: "kanban" | "tableau";
  canEdit: boolean;
}

export function ActionsBoard({ actions, members, commissions, view, canEdit }: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, start] = useTransition();
  const [dragId, setDragId] = useState<string | null>(null);
  const [overColumn, setOverColumn] = useState<ActionStatus | null>(null);
  const [toDelete, setToDelete] = useState<ActionRow | null>(null);

  const switchView = (next: "kanban" | "tableau") => {
    const sp = new URLSearchParams(params.toString());
    sp.set("view", next);
    router.replace(`/management/actions?${sp.toString()}`);
  };

  const drop = (status: ActionStatus, position: number) => {
    const id = dragId;
    setDragId(null);
    setOverColumn(null);
    if (!id) return;
    const action = actions.find((a) => a.id === id);
    if (!action || (action.status === status && action.position === position)) return;
    start(async () => {
      const res = await moveActionAction(id, { status, position });
      if (res.ok) {
        toast.success(`Action déplacée vers « ${ACTION_STATUS_LABELS[status]} ».`);
        router.refresh();
      } else {
        toast.error(res.error ?? "Déplacement impossible.");
      }
    });
  };

  const remove = () => {
    if (!toDelete) return;
    const id = toDelete.id;
    start(async () => {
      const res = await deleteActionAction(id);
      if (res.ok) {
        toast.success("Action supprimée.");
        setToDelete(null);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  };

  const ViewSwitch = (
    <div className="border-border flex rounded-lg border p-0.5">
      {(
        [
          { value: "kanban", label: "Kanban", icon: KanbanSquare },
          { value: "tableau", label: "Tableau", icon: Table2 },
        ] as const
      ).map((v) => (
        <button
          key={v.value}
          type="button"
          onClick={() => switchView(v.value)}
          className={cn(
            "flex items-center gap-1.5 rounded-md px-3 py-1 text-sm transition-colors",
            v.value === view
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <v.icon className="size-3.5" />
          {v.label}
        </button>
      ))}
    </div>
  );

  if (actions.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex justify-end">{ViewSwitch}</div>
        <EmptyState
          icon={ListChecks}
          title="Tout est à jour"
          description="Aucune action ne correspond. Les décisions prises en séance peuvent être transformées en actions de suivi."
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">{ViewSwitch}</div>

      {view === "kanban" ? (
        <div className="grid gap-4 lg:grid-cols-4">
          {KANBAN_COLUMNS.map((status) => {
            const column = actions
              .filter((a) => a.status === status)
              .sort((a, b) => a.position - b.position);
            return (
              <section
                key={status}
                onDragOver={(e) => {
                  if (!canEdit) return;
                  e.preventDefault();
                  setOverColumn(status);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  drop(status, column.length);
                }}
                className={cn(
                  "border-border rounded-2xl border border-t-4 bg-white p-3 transition-colors",
                  COLUMN_TONES[status],
                  overColumn === status && "bg-brand-50/60",
                )}
              >
                <header className="mb-3 flex items-center justify-between px-1">
                  <h2 className="text-foreground text-sm font-semibold">
                    {ACTION_STATUS_LABELS[status]}
                  </h2>
                  <Badge variant="secondary" className="text-[10px]">
                    {column.length}
                  </Badge>
                </header>

                <ul className="space-y-2">
                  {column.map((action, index) => (
                    <li
                      key={action.id}
                      draggable={canEdit}
                      onDragStart={() => setDragId(action.id)}
                      onDragEnd={() => {
                        setDragId(null);
                        setOverColumn(null);
                      }}
                      onDrop={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        drop(status, index);
                      }}
                      className={cn(
                        "border-border rounded-xl border bg-white p-3 transition-all",
                        "hover:shadow-[0_8px_24px_-16px_rgba(15,10,77,0.5)]",
                        canEdit && "cursor-grab active:cursor-grabbing",
                        dragId === action.id && "opacity-40",
                        action.overdue && "border-rose-200",
                      )}
                    >
                      <div className="flex items-start gap-2">
                        {canEdit ? (
                          <GripVertical
                            className="text-muted-foreground mt-0.5 hidden size-3.5 shrink-0 lg:block"
                            aria-hidden
                          />
                        ) : null}
                        <p className="text-foreground min-w-0 flex-1 text-sm font-medium">
                          {action.title}
                        </p>
                        {canEdit ? (
                          <RowMenu
                            action={action}
                            members={members}
                            commissions={commissions}
                            onDelete={() => setToDelete(action)}
                          />
                        ) : null}
                      </div>

                      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                        <Badge
                          variant="outline"
                          className={cn("text-[10px]", ACTION_PRIORITY_STYLES[action.priority])}
                        >
                          {ACTION_PRIORITY_LABELS[action.priority]}
                        </Badge>
                        {action.dueDate ? (
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 text-[11px]",
                              action.overdue ? "text-destructive font-medium" : "text-muted-foreground",
                            )}
                          >
                            {action.overdue ? (
                              <AlertTriangle className="size-3" aria-hidden />
                            ) : (
                              <CalendarClock className="size-3" aria-hidden />
                            )}
                            {format(action.dueDate, "d MMM", { locale: fr })}
                          </span>
                        ) : null}
                      </div>

                      {action.assignee ? (
                        <p className="text-muted-foreground mt-2 truncate text-xs">
                          {action.assignee.lastName} {action.assignee.firstName}
                        </p>
                      ) : null}
                      {action.meeting ? (
                        <Link
                          href={`/management/reunions/${action.meeting.id}`}
                          className="text-muted-foreground mt-1 block truncate text-[11px] underline-offset-2 hover:underline"
                        >
                          {action.meeting.reference}
                        </Link>
                      ) : null}
                    </li>
                  ))}
                  {column.length === 0 ? (
                    <li className="text-muted-foreground rounded-xl border border-dashed px-3 py-6 text-center text-xs">
                      Aucune action
                    </li>
                  ) : null}
                </ul>
              </section>
            );
          })}
        </div>
      ) : (
        <div className="border-border overflow-hidden rounded-2xl border bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Action</TableHead>
                <TableHead>Responsable</TableHead>
                <TableHead>Commission</TableHead>
                <TableHead>Échéance</TableHead>
                <TableHead>Priorité</TableHead>
                <TableHead>État</TableHead>
                {canEdit ? <TableHead className="w-10" /> : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {actions.map((action) => (
                <TableRow key={action.id}>
                  <TableCell>
                    <p className="text-foreground font-medium">{action.title}</p>
                    {action.meeting ? (
                      <p className="text-muted-foreground font-mono text-xs">
                        {action.meeting.reference}
                      </p>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {action.assignee
                      ? `${action.assignee.lastName} ${action.assignee.firstName}`
                      : "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {action.commission?.name ?? "—"}
                  </TableCell>
                  <TableCell className="text-sm">
                    {action.dueDate ? (
                      <span className={cn(action.overdue && "text-destructive font-medium")}>
                        {format(action.dueDate, "d MMM yyyy", { locale: fr })}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn(ACTION_PRIORITY_STYLES[action.priority])}>
                      {ACTION_PRIORITY_LABELS[action.priority]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {ACTION_STATUS_LABELS[action.status]}
                  </TableCell>
                  {canEdit ? (
                    <TableCell>
                      <RowMenu
                        action={action}
                        members={members}
                        commissions={commissions}
                        onDelete={() => setToDelete(action)}
                      />
                    </TableCell>
                  ) : null}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {canEdit && view === "kanban" ? (
        <p className="text-muted-foreground text-center text-xs">
          Faites glisser une carte d&apos;une colonne à l&apos;autre pour changer son état
          {pending ? " · déplacement en cours…" : ""}.
        </p>
      ) : null}

      <AlertDialog open={Boolean(toDelete)} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer « {toDelete?.title} » ?</AlertDialogTitle>
            <AlertDialogDescription>
              L&apos;action disparaît définitivement du suivi. La décision de séance dont elle
              découle, elle, reste au procès-verbal.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction disabled={pending} onClick={remove}>
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function RowMenu({
  action,
  members,
  commissions,
  onDelete,
}: {
  action: ActionRow;
  members: SelectableMember[];
  commissions: CommissionRow[];
  onDelete: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-7 shrink-0"
          aria-label={`Actions sur ${action.title}`}
        >
          <MoreHorizontal className="size-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <ActionFormDialog members={members} commissions={commissions} action={action}>
          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
            <Pencil />
            Modifier
          </DropdownMenuItem>
        </ActionFormDialog>
        <DropdownMenuItem variant="destructive" onSelect={onDelete}>
          <Trash2 />
          Supprimer
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
