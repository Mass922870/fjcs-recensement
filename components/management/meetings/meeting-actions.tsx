"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Archive,
  Ban,
  CircleCheck,
  MoreHorizontal,
  Pencil,
  Play,
  Trash2,
  Undo2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import {
  archiveMeetingAction,
  cancelMeetingAction,
  deleteMeetingAction,
  setMeetingStatusAction,
} from "@/actions/management/meetings";
import type { MeetingDetail } from "@/services/management/meetings.service";

interface Props {
  meeting: MeetingDetail;
  canEdit: boolean;
  canDelete: boolean;
}

export function MeetingActions({ meeting, canEdit, canDelete }: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [reasonError, setReasonError] = useState<string | null>(null);

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, success: string, back = false) =>
    start(async () => {
      const res = await fn();
      if (res.ok) {
        toast.success(success);
        setCancelOpen(false);
        setDeleteOpen(false);
        if (back) router.push("/management/reunions");
        router.refresh();
      } else {
        toast.error(res.error ?? "Une erreur est survenue.");
      }
    });

  const editable = meeting.status === "PLANIFIEE" || meeting.status === "EN_COURS";

  if (!canEdit && !canDelete) return null;

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {canEdit && editable ? (
          <Button variant="outline" asChild>
            <Link href={`/management/reunions/${meeting.id}/modifier`}>
              <Pencil />
              Modifier
            </Link>
          </Button>
        ) : null}

        {canEdit && meeting.status === "PLANIFIEE" ? (
          <Button
            disabled={pending}
            onClick={() => run(() => setMeetingStatusAction(meeting.id, "EN_COURS"), "Séance ouverte.")}
          >
            <Play />
            Ouvrir la séance
          </Button>
        ) : null}

        {canEdit && meeting.status === "EN_COURS" ? (
          <Button
            disabled={pending}
            onClick={() => run(() => setMeetingStatusAction(meeting.id, "TERMINEE"), "Séance clôturée.")}
          >
            <CircleCheck />
            Clôturer la séance
          </Button>
        ) : null}

        {canEdit || canDelete ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Autres actions">
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {canEdit && meeting.status === "TERMINEE" ? (
                <DropdownMenuItem
                  onSelect={() =>
                    run(() => setMeetingStatusAction(meeting.id, "EN_COURS"), "Séance rouverte.")
                  }
                >
                  <Undo2 />
                  Rouvrir la séance
                </DropdownMenuItem>
              ) : null}

              {canEdit && meeting.status === "ANNULEE" ? (
                <DropdownMenuItem
                  onSelect={() =>
                    run(() => setMeetingStatusAction(meeting.id, "PLANIFIEE"), "Réunion rétablie.")
                  }
                >
                  <Undo2 />
                  Rétablir la réunion
                </DropdownMenuItem>
              ) : null}

              {canEdit && editable ? (
                <DropdownMenuItem onSelect={() => setCancelOpen(true)}>
                  <Ban />
                  Annuler la réunion
                </DropdownMenuItem>
              ) : null}

              {canEdit && meeting.status !== "ARCHIVEE" ? (
                <DropdownMenuItem
                  onSelect={() => run(() => archiveMeetingAction(meeting.id), "Réunion archivée.")}
                >
                  <Archive />
                  Archiver
                </DropdownMenuItem>
              ) : null}

              {canDelete ? (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive" onSelect={() => setDeleteOpen(true)}>
                    <Trash2 />
                    Supprimer définitivement
                  </DropdownMenuItem>
                </>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>

      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent className="sm:max-w-md">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const reason = new FormData(e.currentTarget).get("reason");
              setReasonError(null);
              if (typeof reason !== "string" || reason.trim().length < 3) {
                setReasonError("Indiquez brièvement le motif.");
                return;
              }
              run(() => cancelMeetingAction(meeting.id, { reason }), "Réunion annulée.");
            }}
          >
            <DialogHeader>
              <DialogTitle>Annuler cette réunion ?</DialogTitle>
              <DialogDescription>
                Le motif est conservé et affiché sur la fiche. La réunion reste consultable et
                pourra être rétablie.
              </DialogDescription>
            </DialogHeader>
            <Field className="py-4">
              <FieldLabel htmlFor="reason">Motif de l&apos;annulation</FieldLabel>
              <Textarea id="reason" name="reason" rows={3} required />
              <FieldError>{reasonError}</FieldError>
            </Field>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setCancelOpen(false)}>
                Revenir
              </Button>
              <Button type="submit" variant="destructive" disabled={pending}>
                Annuler la réunion
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer « {meeting.title} » ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Elle sera refusée si la séance porte déjà des
              présences, des décisions, des actions ou un procès-verbal : dans ce cas, archivez-la.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              disabled={pending}
              onClick={() => run(() => deleteMeetingAction(meeting.id), "Réunion supprimée.", true)}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
