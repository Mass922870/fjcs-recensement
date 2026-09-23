"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { deleteUserAction } from "@/actions/users";

interface Props {
  user: { id: string; name: string; email: string };
  /** Traces que la suppression laissera sans auteur. */
  impact: { auditEntries: number; createdProfiles: number; member: string | null };
  children: React.ReactNode;
}

/**
 * Suppression d'un compte : geste rare et irréversible, donc confirmé par la
 * saisie de l'adresse. La désactivation reste le geste normal et l'encadré
 * le rappelle, car elle préserve l'attribution du journal d'audit.
 */
export function DeleteUserDialog({ user, impact, children }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [pending, start] = useTransition();

  const matches = confirmation.trim().toLowerCase() === user.email.toLowerCase();

  const remove = () =>
    start(async () => {
      const res = await deleteUserAction(user.id);
      if (res.ok) {
        toast.success(`Compte de ${user.name} supprimé.`);
        setOpen(false);
        setConfirmation("");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setConfirmation("");
      }}
    >
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Supprimer le compte de {user.name} ?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p>
                Cette action est irréversible. Dans la plupart des cas, désactiver le compte suffit
                et préserve l&apos;historique : le compte ne peut plus se connecter, mais son nom
                reste attaché à ce qu&apos;il a fait.
              </p>
              {impact.auditEntries > 0 || impact.createdProfiles > 0 || impact.member ? (
                <div className="border-border bg-muted/40 space-y-1 rounded-lg border p-3 text-sm">
                  <p className="text-foreground font-medium">Ce que la suppression entraînera</p>
                  {impact.auditEntries > 0 ? (
                    <p>
                      {impact.auditEntries === 1
                        ? "1 entrée du journal d'activité perdra son auteur."
                        : `${impact.auditEntries} entrées du journal d'activité perdront leur auteur.`}
                    </p>
                  ) : null}
                  {impact.createdProfiles > 0 ? (
                    <p>
                      {impact.createdProfiles === 1
                        ? "1 profil de jeune restera sans créateur identifié."
                        : `${impact.createdProfiles} profils de jeunes resteront sans créateur identifié.`}{" "}
                      Les profils eux-mêmes ne sont pas supprimés.
                    </p>
                  ) : null}
                  {impact.member ? (
                    <p>
                      Le membre {impact.member} sera détaché de ce compte, mais restera dans la
                      liste des membres du FJCS.
                    </p>
                  ) : null}
                </div>
              ) : (
                <p className="text-sm">Ce compte n&apos;a encore produit aucune trace.</p>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <Field>
          <FieldLabel htmlFor="confirm-email">
            Saisissez l&apos;adresse du compte pour confirmer
          </FieldLabel>
          <Input
            id="confirm-email"
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            placeholder={user.email}
            autoComplete="off"
          />
          <FieldDescription>{user.email}</FieldDescription>
        </Field>

        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction
            disabled={!matches || pending}
            onClick={(e) => {
              e.preventDefault();
              remove();
            }}
          >
            {pending ? <Loader2 data-icon="inline-start" className="animate-spin" /> : null}
            Supprimer définitivement
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
