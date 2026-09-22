"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Archive,
  ArchiveRestore,
  EyeOff,
  Loader2,
  MoreHorizontal,
  Pencil,
  Trash2,
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { anonymizeYouthAction, archiveYouthAction, deleteYouthAction } from "@/actions/youth";
import type { ProfileStatus } from "@/lib/generated/prisma/enums";
import type { Permission } from "@/lib/auth/rbac";

interface Props {
  id: string;
  status: ProfileStatus;
  permissions: Permission[];
}

type Confirm = "anonymize" | "delete" | null;

export function YouthActions({ id, status, permissions }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirm, setConfirm] = useState<Confirm>(null);
  const can = (p: Permission) => permissions.includes(p);
  const isAnonymized = status === "ANONYMIZED";

  const run = (
    fn: () => Promise<{ ok: boolean; error?: string }>,
    success: string,
    after?: () => void,
  ) => {
    startTransition(async () => {
      const res = await fn();
      if (res.ok) {
        toast.success(success);
        after?.();
        router.refresh();
      } else {
        toast.error(res.error ?? "Une erreur est survenue.");
      }
    });
  };

  return (
    <>
      <div className="flex items-center gap-2">
        {can("youth:write") && !isAnonymized ? (
          <Button asChild variant="outline">
            <Link href={`/admin/jeunes/${id}/modifier`}>
              <Pencil data-icon="inline-start" />
              Modifier
            </Link>
          </Button>
        ) : null}
        {can("youth:archive") || can("youth:anonymize") || can("youth:delete") ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Autres actions" disabled={pending}>
                {pending ? <Loader2 className="animate-spin" /> : <MoreHorizontal />}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {can("youth:archive") && !isAnonymized ? (
                status === "ARCHIVED" ? (
                  <DropdownMenuItem
                    onSelect={() => run(() => archiveYouthAction(id, false), "Profil restauré.")}
                  >
                    <ArchiveRestore />
                    Restaurer
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem
                    onSelect={() => run(() => archiveYouthAction(id, true), "Profil archivé.")}
                  >
                    <Archive />
                    Archiver
                  </DropdownMenuItem>
                )
              ) : null}
              {can("youth:anonymize") && !isAnonymized ? (
                <DropdownMenuItem onSelect={() => setConfirm("anonymize")}>
                  <EyeOff />
                  Anonymiser
                </DropdownMenuItem>
              ) : null}
              {can("youth:delete") ? (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive" onSelect={() => setConfirm("delete")}>
                    <Trash2 />
                    Supprimer définitivement
                  </DropdownMenuItem>
                </>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>

      <AlertDialog open={confirm !== null} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirm === "delete"
                ? "Supprimer définitivement ce profil ?"
                : "Anonymiser ce profil ?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirm === "delete"
                ? "Toutes les données de ce jeune seront effacées de la base. Cette action est irréversible et journalisée."
                : "Les informations identifiantes (nom, téléphone, e-mail, établissement…) seront effacées. Les données statistiques (sexe, âge approximatif, quartier, formation, situation, compétences) sont conservées. Cette action est irréversible."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className={
                confirm === "delete"
                  ? "bg-destructive hover:bg-destructive/90 text-white"
                  : undefined
              }
              onClick={() => {
                if (confirm === "delete") {
                  run(
                    () => deleteYouthAction(id),
                    "Profil supprimé.",
                    () => router.push("/admin/jeunes"),
                  );
                } else {
                  run(() => anonymizeYouthAction(id), "Profil anonymisé.");
                }
                setConfirm(null);
              }}
            >
              {confirm === "delete" ? "Supprimer" : "Anonymiser"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
