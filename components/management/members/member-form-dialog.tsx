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
import { MEMBER_STATUS_LABELS } from "@/lib/constants/management";
import type { MemberStatus } from "@/lib/generated/prisma/enums";
import { createMemberAction, updateMemberAction } from "@/actions/management/members";
import type { ActionResult } from "@/lib/action-result";
import type { CommissionRow, MemberRow } from "@/services/management/members.service";

const STATUSES = Object.keys(MEMBER_STATUS_LABELS) as MemberStatus[];
/** Valeur sentinelle : un <SelectItem> ne peut pas porter une valeur vide. */
const NO_COMMISSION = "__aucune__";

interface Props {
  commissions: CommissionRow[];
  member?: MemberRow;
  children: React.ReactNode;
}

export function MemberFormDialog({ commissions, member, children }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [status, setStatus] = useState<MemberStatus>(member?.status ?? "ACTIF");
  const [commissionId, setCommissionId] = useState<string>(
    member?.commission?.id ?? NO_COMMISSION,
  );

  const editing = Boolean(member);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const fd = new FormData(event.currentTarget);
    const values = {
      firstName: fd.get("firstName"),
      lastName: fd.get("lastName"),
      phone: fd.get("phone"),
      email: fd.get("email"),
      role: fd.get("role"),
      notes: fd.get("notes"),
      joinedAt: fd.get("joinedAt"),
      status,
      commissionId: commissionId === NO_COMMISSION ? "" : commissionId,
    };

    setErrors({});
    setGlobalError(null);
    start(async () => {
      const res: ActionResult<unknown> = member
        ? await updateMemberAction(member.id, values)
        : await createMemberAction(values);
      if (res.ok) {
        toast.success(editing ? "Membre mis à jour." : "Membre ajouté.");
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
        <form onSubmit={handleSubmit} noValidate>
          <DialogHeader>
            <DialogTitle>{editing ? "Modifier le membre" : "Ajouter un membre"}</DialogTitle>
            <DialogDescription>
              Un membre du FJCS n&apos;est pas un jeune recensé, et l&apos;ajouter ici ne lui donne
              aucun accès à la plateforme.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="firstName">Prénom</FieldLabel>
              <Input id="firstName" name="firstName" defaultValue={member?.firstName} required />
              <FieldError>{errors.firstName?.[0]}</FieldError>
            </Field>
            <Field>
              <FieldLabel htmlFor="lastName">Nom</FieldLabel>
              <Input id="lastName" name="lastName" defaultValue={member?.lastName} required />
              <FieldError>{errors.lastName?.[0]}</FieldError>
            </Field>

            <Field>
              <FieldLabel htmlFor="phone">Téléphone</FieldLabel>
              <Input
                id="phone"
                name="phone"
                inputMode="tel"
                placeholder="77 123 45 67"
                defaultValue={member?.phone ?? ""}
              />
              <FieldError>{errors.phone?.[0]}</FieldError>
            </Field>
            <Field>
              <FieldLabel htmlFor="email">Adresse e-mail</FieldLabel>
              <Input
                id="email"
                name="email"
                type="email"
                autoCapitalize="none"
                defaultValue={member?.email ?? ""}
              />
              <FieldError>{errors.email?.[0]}</FieldError>
            </Field>

            <Field>
              <FieldLabel htmlFor="role">Fonction</FieldLabel>
              <Input
                id="role"
                name="role"
                placeholder="Trésorier, membre…"
                defaultValue={member?.role ?? ""}
              />
              <FieldError>{errors.role?.[0]}</FieldError>
            </Field>
            <Field>
              <FieldLabel htmlFor="commission">Commission</FieldLabel>
              <Select value={commissionId} onValueChange={setCommissionId}>
                <SelectTrigger id="commission">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_COMMISSION}>Aucune</SelectItem>
                  {commissions.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel htmlFor="status">Statut</FieldLabel>
              <Select value={status} onValueChange={(v) => setStatus(v as MemberStatus)}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {MEMBER_STATUS_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor="joinedAt">Date d&apos;intégration</FieldLabel>
              <Input
                id="joinedAt"
                name="joinedAt"
                type="date"
                defaultValue={
                  member?.joinedAt ? new Date(member.joinedAt).toISOString().slice(0, 10) : ""
                }
              />
              <FieldError>{errors.joinedAt?.[0]}</FieldError>
            </Field>

            <Field className="sm:col-span-2">
              <FieldLabel htmlFor="notes">Notes</FieldLabel>
              <Textarea id="notes" name="notes" rows={2} />
              <FieldError>{errors.notes?.[0]}</FieldError>
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
              {editing ? "Enregistrer" : "Ajouter"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
