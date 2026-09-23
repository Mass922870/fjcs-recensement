"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Download, FileText, FolderClosed, Loader2, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
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
import { deleteDocumentAction, uploadDocumentAction } from "@/actions/management/documents";
import type { DocumentRow } from "@/services/management/documents.service";

const MAX_MB = 4;
const ACCEPT =
  ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg,.webp";

function humanSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
  return `${(bytes / 1024 / 1024).toFixed(1)} Mo`;
}

interface Props {
  documents: DocumentRow[];
  meetingId?: string;
  canUpload: boolean;
  canDelete: boolean;
}

export function DocumentsPanel({ documents, meetingId, canUpload, canDelete }: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [toDelete, setToDelete] = useState<DocumentRow | null>(null);

  const upload = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const fd = new FormData(form);
    const file = fd.get("file");
    if (!(file instanceof File) || file.size === 0) {
      toast.error("Choisissez un fichier.");
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      toast.error(`Fichier trop volumineux. Maximum ${MAX_MB} Mo.`);
      return;
    }
    if (meetingId) fd.set("meetingId", meetingId);

    start(async () => {
      const res = await uploadDocumentAction(fd);
      if (res.ok) {
        toast.success("Document déposé.");
        form.reset();
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  };

  return (
    <div className="space-y-4">
      {canUpload ? (
        <form
          onSubmit={upload}
          className="border-border space-y-3 rounded-2xl border bg-white p-5"
        >
          <h2 className="text-foreground text-sm font-semibold">Déposer un document</h2>
          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <Field>
              <FieldLabel htmlFor="title">Intitulé</FieldLabel>
              <Input id="title" name="title" maxLength={160} placeholder="Reprend le nom du fichier si vide" />
            </Field>
            <Field>
              <FieldLabel htmlFor="file">Fichier</FieldLabel>
              <Input id="file" name="file" type="file" accept={ACCEPT} required />
              <FieldDescription>
                PDF, Word, Excel, PowerPoint ou image · {MAX_MB} Mo maximum
              </FieldDescription>
            </Field>
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 data-icon="inline-start" className="animate-spin" /> : <Upload />}
              Déposer
            </Button>
          </div>
        </form>
      ) : null}

      {documents.length === 0 ? (
        <EmptyState
          icon={FolderClosed}
          title="Aucun document"
          description="Les pièces jointes aux séances, procès-verbaux et actions apparaîtront ici. Elles restent strictement internes."
        />
      ) : (
        <ul className="border-border divide-border divide-y overflow-hidden rounded-2xl border bg-white">
          {documents.map((doc) => (
            <li key={doc.id} className="flex items-center gap-3 px-5 py-3.5">
              <span className="bg-muted text-muted-foreground flex size-9 shrink-0 items-center justify-center rounded-lg">
                <FileText className="size-4" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-foreground truncate text-sm font-medium">{doc.title}</p>
                <p className="text-muted-foreground text-xs">
                  {humanSize(doc.sizeBytes)} · déposé{" "}
                  {format(doc.createdAt, "d MMMM yyyy", { locale: fr })}
                  {doc.uploadedBy ? ` par ${doc.uploadedBy.name}` : ""}
                  {doc.meeting ? ` · ${doc.meeting.reference}` : ""}
                </p>
              </div>
              <Button variant="ghost" size="icon" asChild aria-label={`Télécharger ${doc.title}`}>
                <a href={`/api/management/documents/${doc.id}`}>
                  <Download className="size-4" />
                </a>
              </Button>
              {canDelete ? (
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Supprimer ${doc.title}`}
                  onClick={() => setToDelete(doc)}
                >
                  <Trash2 className="text-destructive size-4" />
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      <AlertDialog open={Boolean(toDelete)} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer « {toDelete?.title} » ?</AlertDialogTitle>
            <AlertDialogDescription>
              Le fichier est effacé définitivement. La suppression est journalisée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              disabled={pending}
              onClick={() => {
                if (!toDelete) return;
                const id = toDelete.id;
                start(async () => {
                  const res = await deleteDocumentAction(id);
                  if (res.ok) {
                    toast.success("Document supprimé.");
                    setToDelete(null);
                    router.refresh();
                  } else {
                    toast.error(res.error);
                  }
                });
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
