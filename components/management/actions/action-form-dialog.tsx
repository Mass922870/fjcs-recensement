"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ACTION_PRIORITY_LABELS, ACTION_STATUS_LABELS } from "@/lib/constants/management";
import type { ActionPriority, ActionStatus } from "@/lib/generated/prisma/enums";
import {
  createActionAction,
  createActionFromDecisionAction,
  updateActionAction,
} from "@/actions/management/actions";
import type { ActionRow } from "@/services/management/actions.service";
import type { CommissionRow } from "@/services/management/members.service";
import type { SelectableMember } from "@/services/management/meetings.service";

const NONE = "__aucun__";
const PRIORITIES = Object.keys(ACTION_PRIORITY_LABELS) as ActionPriority[];
const STATUSES = Object.keys(ACTION_STATUS_LABELS) as ActionStatus[];

interface Props {
  members: SelectableMember[];
  commissions: CommissionRow[];
  action?: ActionRow;
  /** Crée l'action à partir d'une décision de séance. */
  fromDecision?: { decisionId: string; title: string; meetingId: string };
  children: React.ReactNode;
}

function isoDay(date: Date | null | undefined): string {
  if (!date) return "";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;
}

export function ActionFormDialog({ members, commissions, action, fromDecision, children }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);

  const [assigneeId, setAssigneeId] = useState(action?.assignee?.id ?? NONE);
  const [commissionId, setCommissionId] = useState(action?.commission?.id ?? NONE);
  const [priority, setPriority] = useState<ActionPriority>(action?.priority ?? "NORMALE");
  const [status, setStatus] = useState<ActionStatus>(action?.status ?? "A_FAIRE");

  const editing = Boolean(action);

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const fd = new FormData(event.currentTarget);
    const values = {
      title: fd.get("title"),
      description: fd.get("description"),
      dueDate: fd.get("dueDate"),
      assigneeId: assigneeId === NONE ? "" : assigneeId,
      commissionId: commissionId === NONE ? "" : commissionId,
      priority,
      status,
      meetingId: action?.meeting?.id ?? fromDecision?.meetingId ?? "",
      decisionId: action?.decision?.id ?? "",
    };

    setErrors({});
    setGlobalError(null);
    start(async () => {
      const res = action
        ? await updateActionAction(action.id, values)
        : fromDecision
          ? await createActionFromDecisionAction(fromDecision.decisionId, values)
          : await createActionAction(values);
      if (res.ok) {
        toast.success(editing ? "Action mise à jour." : "Action créée.");
        setOpen(false);
        router.refresh();
      } else {
        setErrors(res.fieldErrors ?? {});
        if (!res.fieldErrors) setGlobalError(res.error);
        else toast.error(res.error);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={submit} noValidate>
          <DialogHeader>
            <DialogTitle>{editing ? "Modifier l'action" : "Nouvelle action"}</DialogTitle>
            <DialogDescription>
              {fromDecision
                ? "Cette action assurera le suivi de la décision prise en séance."
                : "Une action a un responsable, une échéance et un état de suivi."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4 sm:grid-cols-2">
            <Field className="sm:col-span-2">
              <FieldLabel htmlFor="title">Intitulé</FieldLabel>
              <Input
                id="title"
                name="title"
                defaultValue={action?.title ?? fromDecision?.title ?? ""}
                required
              />
              <FieldError>{errors.title?.[0]}</FieldError>
            </Field>

            <Field className="sm:col-span-2">
              <FieldLabel htmlFor="description">Description</FieldLabel>
              <Textarea
                id="description"
                name="description"
                rows={3}
                defaultValue={action?.description ?? ""}
              />
              <FieldError>{errors.description?.[0]}</FieldError>
            </Field>

            <Field>
              <FieldLabel htmlFor="assignee">Responsable</FieldLabel>
              <Select value={assigneeId} onValueChange={setAssigneeId}>
                <SelectTrigger id="assignee" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Non assignée</SelectItem>
                  {members.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.lastName} {m.firstName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel htmlFor="commission">Commission</FieldLabel>
              <Select value={commissionId} onValueChange={setCommissionId}>
                <SelectTrigger id="commission" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Aucune</SelectItem>
                  {commissions.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel htmlFor="dueDate">Échéance</FieldLabel>
              <Input
                id="dueDate"
                name="dueDate"
                type="date"
                defaultValue={isoDay(action?.dueDate)}
              />
              <FieldError>{errors.dueDate?.[0]}</FieldError>
            </Field>

            <Field>
              <FieldLabel htmlFor="priority">Priorité</FieldLabel>
              <Select value={priority} onValueChange={(v) => setPriority(v as ActionPriority)}>
                <SelectTrigger id="priority" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {ACTION_PRIORITY_LABELS[p]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field className="sm:col-span-2">
              <FieldLabel htmlFor="status">État</FieldLabel>
              <Select value={status} onValueChange={(v) => setStatus(v as ActionStatus)}>
                <SelectTrigger id="status" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {ACTION_STATUS_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          {globalError ? (
            <Alert variant="destructive" className="mb-2">
              <AlertDescription>{globalError}</AlertDescription>
            </Alert>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 data-icon="inline-start" className="animate-spin" /> : null}
              {editing ? "Enregistrer" : "Créer l'action"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
