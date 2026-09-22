"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
import { applyRetentionAction } from "@/actions/settings";

export function RetentionPanel({
  months,
  expired,
  canApply,
}: {
  months: number;
  expired: number;
  canApply: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();

  return (
    <section className="border-border rounded-2xl border bg-white p-5">
      <h2 className="text-foreground text-sm font-semibold">Politique de conservation</h2>
      <p className="text-muted-foreground mt-1 text-sm">
        Les profils inscrits depuis plus de{" "}
        <span className="text-foreground font-medium">{months} mois</span> doivent être anonymisés :
        les informations identifiantes sont effacées, les données statistiques conservées.
      </p>
      <p className="text-foreground mt-3 text-2xl font-semibold">{expired}</p>
      <p className="text-muted-foreground text-xs">
        profil{expired > 1 ? "s" : ""} au-delà de la durée de conservation
      </p>
      {canApply ? (
        <Button
          className="mt-4"
          variant="outline"
          disabled={expired === 0 || pending}
          onClick={() => setOpen(true)}
        >
          {pending ? (
            <Loader2 data-icon="inline-start" className="animate-spin" />
          ) : (
            <EyeOff data-icon="inline-start" />
          )}
          Anonymiser les profils expirés
        </Button>
      ) : null}

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Anonymiser {expired} profil{expired > 1 ? "s" : ""} ?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Action irréversible et journalisée. Les noms, téléphones, e-mails et établissements
              seront effacés ; sexe, âge approximatif, quartier, formation, situation, compétences
              et besoins restent disponibles pour les statistiques.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                start(async () => {
                  const res = await applyRetentionAction();
                  if (res.ok) {
                    toast.success(`${res.data?.count ?? 0} profil(s) anonymisé(s).`);
                    router.refresh();
                  } else toast.error(res.error);
                })
              }
            >
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
