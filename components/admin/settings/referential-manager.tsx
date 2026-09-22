"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Loader2, Lock, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  deleteReferentialAction,
  moveReferentialAction,
  saveReferentialAction,
} from "@/actions/referentials";
import { REFERENTIAL_KINDS, type ReferentialKind } from "@/lib/constants/referential-kinds";
import { EMPLOYMENT_KIND_LABELS, EMPLOYMENT_KIND_ORDER } from "@/lib/constants/referentials";
import type { EmploymentKind } from "@/lib/generated/prisma/enums";
import type { ReferentialRow } from "@/services/referential-admin.service";
import { cn } from "@/lib/utils";

interface Props {
  kind: ReferentialKind;
  rows: ReferentialRow[];
  /** Catégories disponibles (uniquement pour les compétences). */
  categories?: { id: string; label: string }[];
}

type Errors = Record<string, string[] | undefined>;

export function ReferentialManager({ kind, rows, categories = [] }: Props) {
  const router = useRouter();
  const meta = REFERENTIAL_KINDS[kind];
  const [editing, setEditing] = useState<ReferentialRow | null | "new">(null);
  const [deleting, setDeleting] = useState<ReferentialRow | null>(null);
  const [pending, start] = useTransition();

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, success: string) =>
    start(async () => {
      const res = await fn();
      if (res.ok) {
        toast.success(success);
        router.refresh();
      } else toast.error(res.error ?? "Une erreur est survenue.");
    });

  return (
    <section className="border-border rounded-2xl border bg-white">
      <header className="border-border/70 flex items-start justify-between gap-3 border-b px-5 py-3">
        <div>
          <h2 className="text-foreground text-sm font-semibold">{meta.label}</h2>
          <p className="text-muted-foreground text-xs">{meta.hint}</p>
        </div>
        <Button size="sm" onClick={() => setEditing("new")}>
          <Plus data-icon="inline-start" />
          Ajouter
        </Button>
      </header>

      {rows.length === 0 ? (
        <p className="text-muted-foreground px-5 py-8 text-center text-sm">
          Aucun élément. Ajoutez-en un.
        </p>
      ) : (
        <ul className="divide-border/70 divide-y">
          {rows.map((r, i) => (
            <li
              key={r.id}
              className={cn(
                "flex items-center gap-3 px-4 py-2.5 text-sm",
                !r.isActive && "bg-muted/30",
              )}
            >
              <div className="flex shrink-0 flex-col">
                <Button
                  variant="ghost"
                  size="icon-xs"
                  aria-label="Monter"
                  disabled={i === 0 || pending}
                  onClick={() =>
                    run(() => moveReferentialAction(kind, r.id, "up"), "Ordre mis à jour.")
                  }
                >
                  <ArrowUp />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  aria-label="Descendre"
                  disabled={i === rows.length - 1 || pending}
                  onClick={() =>
                    run(() => moveReferentialAction(kind, r.id, "down"), "Ordre mis à jour.")
                  }
                >
                  <ArrowDown />
                </Button>
              </div>
              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    "font-medium",
                    r.isActive ? "text-foreground" : "text-muted-foreground line-through",
                  )}
                >
                  {r.label}
                  {r.isSystem ? (
                    <Lock
                      className="text-muted-foreground ml-1.5 inline size-3"
                      aria-label="Élément système"
                    />
                  ) : null}
                </p>
                <p className="text-muted-foreground truncate text-xs">
                  {kind === "need" && r.question ? `« ${r.question} » · ` : ""}
                  {kind === "skill" && r.categoryLabel ? `${r.categoryLabel} · ` : ""}
                  {kind === "employmentStatus" && r.kind
                    ? `${EMPLOYMENT_KIND_LABELS[r.kind]}${r.requiresDetail ? " · précision demandée" : ""} · `
                    : ""}
                  {kind === "quartier"
                    ? r.latitude != null && r.longitude != null
                      ? `${r.latitude.toFixed(4)}, ${r.longitude.toFixed(4)} · `
                      : "sans coordonnées · "
                    : ""}
                  {kind === "sector"
                    ? ""
                    : `${r.usage} ${kind === "skillCategory" ? "compétence" : "profil"}${r.usage > 1 ? "s" : ""}`}
                </p>
              </div>
              {!r.isActive ? (
                <Badge variant="outline" className="text-muted-foreground">
                  Inactif
                </Badge>
              ) : null}
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Modifier ${r.label}`}
                onClick={() => setEditing(r)}
              >
                <Pencil />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Supprimer ${r.label}`}
                disabled={r.isSystem || r.usage > 0}
                title={
                  r.isSystem
                    ? "Élément système : renommable, non supprimable"
                    : r.usage > 0
                      ? "Utilisé par des profils : désactivez-le plutôt"
                      : undefined
                }
                onClick={() => setDeleting(r)}
              >
                <Trash2 className="text-destructive" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      {editing ? (
        <ItemDialog
          kind={kind}
          item={editing === "new" ? null : editing}
          categories={categories}
          onClose={() => setEditing(null)}
        />
      ) : null}

      <AlertDialog open={deleting !== null} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer « {deleting?.label} » ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette valeur n'est utilisée par aucun profil. La suppression est définitive.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90 text-white"
              onClick={() => {
                if (deleting)
                  run(() => deleteReferentialAction(kind, deleting.id), "Élément supprimé.");
                setDeleting(null);
              }}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}

function ItemDialog({
  kind,
  item,
  categories,
  onClose,
}: {
  kind: ReferentialKind;
  item: ReferentialRow | null;
  categories: { id: string; label: string }[];
  onClose: () => void;
}) {
  const router = useRouter();
  const meta = REFERENTIAL_KINDS[kind];
  const [pending, start] = useTransition();
  const [errors, setErrors] = useState<Errors>({});
  const [isActive, setIsActive] = useState(item?.isActive ?? true);
  const [requiresDetail, setRequiresDetail] = useState(item?.requiresDetail ?? false);
  const [employmentKind, setEmploymentKind] = useState<EmploymentKind>(item?.kind ?? "OTHER");
  const [categoryId, setCategoryId] = useState(item?.categoryId ?? categories[0]?.id ?? "");

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            setErrors({});
            start(async () => {
              const res = await saveReferentialAction(kind, item?.id ?? null, {
                label: fd.get("label"),
                isActive,
                latitude: fd.get("latitude") ?? undefined,
                longitude: fd.get("longitude") ?? undefined,
                categoryId,
                question: fd.get("question") ?? "",
                kind: employmentKind,
                requiresDetail,
              });
              if (res.ok) {
                toast.success(item ? "Élément mis à jour." : "Élément ajouté.");
                onClose();
                router.refresh();
              } else {
                setErrors(res.fieldErrors ?? {});
                toast.error(res.error);
              }
            });
          }}
        >
          <DialogHeader>
            <DialogTitle>
              {item ? `Modifier ${meta.singular}` : `Ajouter ${meta.singular}`}
            </DialogTitle>
            <DialogDescription>
              {item?.isSystem
                ? "Élément système : le libellé est modifiable, la valeur reste liée aux indicateurs."
                : "Visible dans le formulaire dès l'enregistrement."}
            </DialogDescription>
          </DialogHeader>

          <Field data-invalid={!!errors.label}>
            <FieldLabel htmlFor="ref-label">Libellé</FieldLabel>
            <Input
              id="ref-label"
              name="label"
              defaultValue={item?.label ?? ""}
              required
              autoFocus
            />
            <FieldError>{errors.label?.[0]}</FieldError>
          </Field>

          {kind === "need" ? (
            <Field data-invalid={!!errors.question}>
              <FieldLabel htmlFor="ref-question">Question posée</FieldLabel>
              <Input
                id="ref-question"
                name="question"
                defaultValue={item?.question ?? ""}
                placeholder="Ex. Souhaitez-vous suivre une formation ?"
              />
              <FieldDescription>
                Le libellé sert dans les statistiques, la question dans le formulaire.
              </FieldDescription>
              <FieldError>{errors.question?.[0]}</FieldError>
            </Field>
          ) : null}

          {kind === "skill" ? (
            <Field data-invalid={!!errors.categoryId}>
              <FieldLabel htmlFor="ref-category">Catégorie</FieldLabel>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger id="ref-category" className="w-full">
                  <SelectValue placeholder="Choisir" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError>{errors.categoryId?.[0]}</FieldError>
            </Field>
          ) : null}

          {kind === "employmentStatus" ? (
            <>
              <Field>
                <FieldLabel htmlFor="ref-kind">Sens statistique</FieldLabel>
                <Select
                  value={employmentKind}
                  onValueChange={(v) => setEmploymentKind(v as EmploymentKind)}
                >
                  <SelectTrigger id="ref-kind" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EMPLOYMENT_KIND_ORDER.map((k) => (
                      <SelectItem key={k} value={k}>
                        {EMPLOYMENT_KIND_LABELS[k]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldDescription>
                  Pilote les indicateurs (entrepreneurs, étudiants, demandeurs d'emploi) et les
                  questions sur l'activité.
                </FieldDescription>
              </Field>
              <Field orientation="horizontal">
                <Switch
                  id="ref-detail"
                  checked={requiresDetail}
                  onCheckedChange={setRequiresDetail}
                />
                <FieldLabel htmlFor="ref-detail">Demander une précision libre</FieldLabel>
              </Field>
            </>
          ) : null}

          {kind === "quartier" ? (
            <div className="grid grid-cols-2 gap-3">
              <Field data-invalid={!!errors.latitude}>
                <FieldLabel htmlFor="ref-lat">Latitude</FieldLabel>
                <Input
                  id="ref-lat"
                  name="latitude"
                  type="number"
                  step="0.0001"
                  defaultValue={item?.latitude ?? ""}
                  placeholder="14.7796"
                />
                <FieldError>{errors.latitude?.[0]}</FieldError>
              </Field>
              <Field data-invalid={!!errors.longitude}>
                <FieldLabel htmlFor="ref-lng">Longitude</FieldLabel>
                <Input
                  id="ref-lng"
                  name="longitude"
                  type="number"
                  step="0.0001"
                  defaultValue={item?.longitude ?? ""}
                  placeholder="-17.2276"
                />
                <FieldError>{errors.longitude?.[0]}</FieldError>
              </Field>
              <FieldDescription className="col-span-2">
                Position du centre du quartier pour la carte (Google Maps : clic droit →
                coordonnées).
              </FieldDescription>
            </div>
          ) : null}

          <Field orientation="horizontal">
            <Switch id="ref-active" checked={isActive} onCheckedChange={setIsActive} />
            <div>
              <FieldLabel htmlFor="ref-active">Proposé dans le formulaire</FieldLabel>
              <FieldDescription>
                Désactivé : retiré du formulaire, conservé pour les profils existants.
              </FieldDescription>
            </div>
          </Field>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={pending}>
              Annuler
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 data-icon="inline-start" className="animate-spin" /> : null}
              Enregistrer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
