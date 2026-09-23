"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/shared/states";
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
import {
  createCommissionAction,
  deleteCommissionAction,
  updateCommissionAction,
} from "@/actions/management/members";
import type { CommissionRow } from "@/services/management/members.service";
import { Building2 } from "lucide-react";

interface Props {
  commissions: CommissionRow[];
  canManage: boolean;
}

export function CommissionManager({ commissions, canManage }: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [toDelete, setToDelete] = useState<CommissionRow | null>(null);

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, success: string) =>
    start(async () => {
      const res = await fn();
      if (res.ok) {
        toast.success(success);
        setEditingId(null);
        setAdding(false);
        setToDelete(null);
        router.refresh();
      } else {
        toast.error(res.error ?? "Une erreur est survenue.");
      }
    });

  return (
    <div className="space-y-3">
      {commissions.length === 0 && !adding ? (
        <EmptyState
          icon={Building2}
          title="Aucune commission"
          description="Créez les commissions du FJCS : elles serviront à rattacher les membres, les réunions et les actions."
          action={
            canManage ? (
              <Button onClick={() => setAdding(true)}>
                <Plus />
                Créer une commission
              </Button>
            ) : null
          }
        />
      ) : null}

      {commissions.map((c) =>
        editingId === c.id ? (
          <CommissionForm
            key={c.id}
            commission={c}
            pending={pending}
            onCancel={() => setEditingId(null)}
            onSubmit={(values) =>
              run(() => updateCommissionAction(c.id, values), "Commission mise à jour.")
            }
          />
        ) : (
          <div
            key={c.id}
            className="border-border flex items-center justify-between gap-3 rounded-xl border bg-white px-4 py-3"
          >
            <div className="min-w-0">
              <p className="text-foreground flex items-center gap-2 text-sm font-medium">
                {c.name}
                {c.acronym ? (
                  <span className="text-muted-foreground text-xs">({c.acronym})</span>
                ) : null}
                {!c.isActive ? (
                  <Badge variant="secondary" className="text-[10px]">
                    inactive
                  </Badge>
                ) : null}
              </p>
              <p className="text-muted-foreground mt-0.5 text-xs">
                {c._count.members} membre{c._count.members > 1 ? "s" : ""} ·{" "}
                {c._count.meetings} réunion{c._count.meetings > 1 ? "s" : ""}
                {c.description ? ` · ${c.description}` : ""}
              </p>
            </div>
            {canManage ? (
              <div className="flex shrink-0 items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Modifier ${c.name}`}
                  onClick={() => setEditingId(c.id)}
                >
                  <Pencil />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Supprimer ${c.name}`}
                  onClick={() => setToDelete(c)}
                >
                  <Trash2 className="text-destructive" />
                </Button>
              </div>
            ) : null}
          </div>
        ),
      )}

      {adding ? (
        <CommissionForm
          pending={pending}
          onCancel={() => setAdding(false)}
          onSubmit={(values) => run(() => createCommissionAction(values), "Commission créée.")}
        />
      ) : canManage && commissions.length > 0 ? (
        <Button variant="outline" onClick={() => setAdding(true)}>
          <Plus />
          Ajouter une commission
        </Button>
      ) : null}

      <AlertDialog open={Boolean(toDelete)} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer « {toDelete?.name} » ?</AlertDialogTitle>
            <AlertDialogDescription>
              La suppression est refusée si des membres ou des réunions y sont rattachés. Dans ce
              cas, désactivez la commission plutôt que de la supprimer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              disabled={pending}
              onClick={() => {
                if (toDelete) run(() => deleteCommissionAction(toDelete.id), "Commission supprimée.");
              }}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function CommissionForm({
  commission,
  pending,
  onCancel,
  onSubmit,
}: {
  commission?: CommissionRow;
  pending: boolean;
  onCancel: () => void;
  onSubmit: (values: unknown) => void;
}) {
  const [isActive, setIsActive] = useState(commission?.isActive ?? true);

  return (
    <form
      className="border-border space-y-3 rounded-xl border bg-white p-4"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        onSubmit({
          name: fd.get("name"),
          acronym: fd.get("acronym"),
          description: fd.get("description"),
          isActive,
        });
      }}
    >
      <div className="grid gap-3 sm:grid-cols-[2fr_1fr]">
        <Input
          name="name"
          defaultValue={commission?.name}
          placeholder="Nom de la commission"
          aria-label="Nom de la commission"
          required
        />
        <Input
          name="acronym"
          defaultValue={commission?.acronym ?? ""}
          placeholder="Sigle (facultatif)"
          aria-label="Sigle"
        />
      </div>
      <Input
        name="description"
        defaultValue={commission?.description ?? ""}
        placeholder="Description (facultatif)"
        aria-label="Description"
      />
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Switch id="isActive" checked={isActive} onCheckedChange={setIsActive} />
          <Label htmlFor="isActive" className="text-sm font-normal">
            Commission active
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            <X />
            Annuler
          </Button>
          <Button type="submit" size="sm" disabled={pending}>
            {pending ? <Loader2 className="animate-spin" /> : <Check />}
            Enregistrer
          </Button>
        </div>
      </div>
    </form>
  );
}
