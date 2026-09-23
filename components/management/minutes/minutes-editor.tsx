"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CheckCircle2, Loader2, Lock, Save, Send, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MINUTES_STATUS_LABELS, ATTENDANCE_STATUS_LABELS } from "@/lib/constants/management";
import { MINUTES_TRANSITIONS } from "@/schemas/management/minutes";
import {
  openMinutesVersionAction,
  saveMinutesAction,
  transitionMinutesAction,
} from "@/actions/management/minutes";
import type { MinutesDetail } from "@/services/management/minutes.service";
import type { SelectableMember } from "@/services/management/meetings.service";
import { cn } from "@/lib/utils";

const NONE = "__aucun__";

interface PointDraft {
  agendaItemId: string;
  title: string;
  discussion: string;
  decision: string;
}

interface Props {
  minutes: MinutesDetail;
  members: SelectableMember[];
  canEdit: boolean;
  canValidate: boolean;
}

export function MinutesEditor({ minutes, members, canEdit, canValidate }: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [revisionOpen, setRevisionOpen] = useState(false);

  const locked = minutes.status === "VALIDE" || minutes.status === "ARCHIVE";
  const editable = canEdit && !locked;

  const [chairId, setChairId] = useState(minutes.chair?.id ?? NONE);
  const [secretaryId, setSecretaryId] = useState(minutes.secretary?.id ?? NONE);
  const [fields, setFields] = useState({
    introduction: minutes.introduction ?? "",
    proceedings: minutes.proceedings ?? "",
    observations: minutes.observations ?? "",
    misc: minutes.misc ?? "",
    conclusion: minutes.conclusion ?? "",
  });
  const [points, setPoints] = useState<PointDraft[]>(() =>
    minutes.meeting.agenda.map((a) => ({
      agendaItemId: a.id,
      title: a.title,
      discussion: a.discussion ?? "",
      decision: minutes.meeting.decisions.find((d) => d.agendaItemId === a.id)?.title ?? "",
    })),
  );

  const patchPoint = (id: string, patch: Partial<PointDraft>) =>
    setPoints((list) => list.map((p) => (p.agendaItemId === id ? { ...p, ...patch } : p)));

  const save = () =>
    start(async () => {
      const res = await saveMinutesAction(minutes.meeting.id, {
        chairId: chairId === NONE ? "" : chairId,
        secretaryId: secretaryId === NONE ? "" : secretaryId,
        ...fields,
        points: points.map((p) => ({
          agendaItemId: p.agendaItemId,
          discussion: p.discussion,
          decision: p.decision,
        })),
      });
      if (res.ok) {
        toast.success("Procès-verbal enregistré.");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });

  const transition = (status: string, message: string) =>
    start(async () => {
      const res = await transitionMinutesAction(minutes.meeting.id, { status });
      if (res.ok) {
        toast.success(message);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });

  const next = MINUTES_TRANSITIONS[minutes.status];
  const present = minutes.meeting.attendances.filter(
    (a) => a.status === "PRESENT" || a.status === "RETARD",
  );
  const absent = minutes.meeting.attendances.filter(
    (a) => a.status === "ABSENT" || a.status === "EXCUSE",
  );

  return (
    <div className="space-y-6">
      <div className="border-border flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-white p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">{MINUTES_STATUS_LABELS[minutes.status]}</Badge>
          <span className="text-muted-foreground text-sm">Version {minutes.version}</span>
          {minutes.validatedAt ? (
            <span className="text-muted-foreground text-xs">
              validé le {format(minutes.validatedAt, "d MMMM yyyy", { locale: fr })}
            </span>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {editable ? (
            <Button onClick={save} disabled={pending} variant="outline">
              {pending ? <Loader2 className="animate-spin" /> : <Save />}
              Enregistrer
            </Button>
          ) : null}

          {canEdit && next.includes("EN_REVISION") && minutes.status === "BROUILLON" ? (
            <Button disabled={pending} onClick={() => transition("EN_REVISION", "PV mis en révision.")}>
              <Send />
              Passer en révision
            </Button>
          ) : null}
          {canEdit && next.includes("A_VALIDER") ? (
            <Button disabled={pending} onClick={() => transition("A_VALIDER", "PV soumis à validation.")}>
              <Send />
              Soumettre à validation
            </Button>
          ) : null}
          {canEdit && minutes.status === "EN_REVISION" ? (
            <Button
              variant="ghost"
              disabled={pending}
              onClick={() => transition("BROUILLON", "PV remis en brouillon.")}
            >
              <Undo2 />
              Remettre en brouillon
            </Button>
          ) : null}
          {canValidate && next.includes("VALIDE") ? (
            <Button disabled={pending} onClick={() => transition("VALIDE", "Procès-verbal validé.")}>
              <CheckCircle2 />
              Valider
            </Button>
          ) : null}
          {canValidate && locked ? (
            <Button variant="outline" disabled={pending} onClick={() => setRevisionOpen(true)}>
              <Undo2 />
              Nouvelle version
            </Button>
          ) : null}
        </div>
      </div>

      {locked ? (
        <Alert>
          <AlertDescription className="flex items-start gap-2">
            <Lock className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span>
              Ce procès-verbal est validé et n&apos;est plus modifiable. Pour le corriger, ouvrez
              une nouvelle version : la version {minutes.version} restera conservée telle quelle.
            </span>
          </AlertDescription>
        </Alert>
      ) : null}

      <Section title="Informations de séance">
        <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
          <Row label="Réunion" value={minutes.meeting.title} />
          <Row label="Référence" value={minutes.meeting.reference} />
          <Row
            label="Date"
            value={format(minutes.meeting.startsAt, "EEEE d MMMM yyyy", { locale: fr })}
          />
          <Row
            label="Horaire"
            value={`${format(minutes.meeting.startsAt, "HH'h'mm")}${
              minutes.meeting.endsAt ? ` — ${format(minutes.meeting.endsAt, "HH'h'mm")}` : ""
            }`}
          />
          <Row label="Lieu" value={minutes.meeting.location ?? "Non précisé"} />
          <Row label="Commission" value={minutes.meeting.commission?.name ?? "Aucune"} />
        </dl>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="chair">Président de séance</FieldLabel>
            <Select value={chairId} onValueChange={setChairId} disabled={!editable}>
              <SelectTrigger id="chair" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Non désigné</SelectItem>
                {members.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.lastName} {m.firstName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel htmlFor="secretary">Secrétaire de séance</FieldLabel>
            <Select value={secretaryId} onValueChange={setSecretaryId} disabled={!editable}>
              <SelectTrigger id="secretary" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Non désigné</SelectItem>
                {members.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.lastName} {m.firstName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
      </Section>

      <Section
        title="Participants"
        subtitle="Repris automatiquement de la feuille de présence."
      >
        {minutes.meeting.attendances.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Aucune présence pointée. Renseignez la feuille de présence : elle alimentera cette
            section et le PDF.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <NameList
              title={`Présents (${present.length})`}
              items={present.map((a) => `${a.member.lastName} ${a.member.firstName}`)}
            />
            <NameList
              title={`Absents et excusés (${absent.length})`}
              items={absent.map(
                (a) =>
                  `${a.member.lastName} ${a.member.firstName} — ${ATTENDANCE_STATUS_LABELS[a.status].toLowerCase()}`,
              )}
            />
          </div>
        )}
      </Section>

      <Section title="Introduction">
        <Textarea
          value={fields.introduction}
          disabled={!editable}
          onChange={(e) => setFields({ ...fields, introduction: e.target.value })}
          rows={3}
          placeholder="Ouverture de la séance, vérification du quorum, mot d'accueil…"
          aria-label="Introduction du procès-verbal"
        />
      </Section>

      <Section
        title="Déroulement, point par point"
        subtitle="Chaque point de l'ordre du jour reçoit son compte rendu et sa décision."
      >
        {points.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            L&apos;ordre du jour est vide. Complétez-le dans la réunion pour structurer le
            procès-verbal.
          </p>
        ) : (
          <ol className="space-y-4">
            {points.map((point, index) => (
              <li key={point.agendaItemId} className="border-border rounded-xl border p-4">
                <div className="mb-3 flex items-start gap-2.5">
                  <span className="bg-brand-50 text-brand-700 mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md text-xs font-semibold">
                    {index + 1}
                  </span>
                  <p className="text-foreground text-sm font-medium">{point.title}</p>
                </div>
                <div className="space-y-3 sm:pl-9">
                  <Field>
                    <FieldLabel htmlFor={`d-${point.agendaItemId}`} className="text-xs">
                      Discussion
                    </FieldLabel>
                    <Textarea
                      id={`d-${point.agendaItemId}`}
                      value={point.discussion}
                      disabled={!editable}
                      onChange={(e) => patchPoint(point.agendaItemId, { discussion: e.target.value })}
                      rows={3}
                      placeholder="Échanges, arguments, points soulevés…"
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor={`dec-${point.agendaItemId}`} className="text-xs">
                      Décision
                    </FieldLabel>
                    <Textarea
                      id={`dec-${point.agendaItemId}`}
                      value={point.decision}
                      disabled={!editable}
                      onChange={(e) => patchPoint(point.agendaItemId, { decision: e.target.value })}
                      rows={2}
                      placeholder="Ce qui a été décidé sur ce point"
                    />
                  </Field>
                </div>
              </li>
            ))}
          </ol>
        )}
      </Section>

      {(["observations", "misc", "conclusion"] as const).map((key) => (
        <Section
          key={key}
          title={
            key === "observations"
              ? "Observations"
              : key === "misc"
                ? "Questions diverses"
                : "Conclusion et clôture"
          }
        >
          <Textarea
            value={fields[key]}
            disabled={!editable}
            onChange={(e) => setFields({ ...fields, [key]: e.target.value })}
            rows={3}
            aria-label={key}
          />
        </Section>
      ))}

      {minutes.versions.length > 0 ? (
        <Section title="Versions précédentes">
          <ul className="divide-border divide-y text-sm">
            {minutes.versions.map((v) => (
              <li key={v.id} className="flex items-center justify-between gap-3 py-2">
                <span className="text-foreground">Version {v.version}</span>
                <span className="text-muted-foreground text-xs">
                  {v.reason ?? "Validation"} ·{" "}
                  {format(v.createdAt, "d MMMM yyyy 'à' HH'h'mm", { locale: fr })}
                </span>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      <Dialog open={revisionOpen} onOpenChange={setRevisionOpen}>
        <DialogContent className="sm:max-w-md">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const reason = new FormData(e.currentTarget).get("reason");
              start(async () => {
                const res = await openMinutesVersionAction(minutes.meeting.id, { reason });
                if (res.ok) {
                  toast.success(`Version ${minutes.version + 1} ouverte.`);
                  setRevisionOpen(false);
                  router.refresh();
                } else {
                  toast.error(res.error);
                }
              });
            }}
          >
            <DialogHeader>
              <DialogTitle>Ouvrir la version {minutes.version + 1} ?</DialogTitle>
              <DialogDescription>
                La version {minutes.version} reste conservée en l&apos;état. Le procès-verbal
                repasse en révision et devra être validé à nouveau.
              </DialogDescription>
            </DialogHeader>
            <Field className="py-4">
              <FieldLabel htmlFor="reason">Motif de la reprise</FieldLabel>
              <Textarea id="reason" name="reason" rows={3} required />
            </Field>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setRevisionOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={pending}>
                Ouvrir la nouvelle version
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-border rounded-2xl border bg-white p-5">
      <div className="mb-3">
        <h2 className="text-foreground text-sm font-semibold">{title}</h2>
        {subtitle ? <p className="text-muted-foreground mt-0.5 text-xs">{subtitle}</p> : null}
      </div>
      {children}
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-muted-foreground text-xs tracking-wide uppercase">{label}</dt>
      <dd className="text-foreground mt-0.5 text-sm">{value}</dd>
    </div>
  );
}

function NameList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className={cn("text-muted-foreground mb-1.5 text-xs font-medium")}>{title}</p>
      {items.length === 0 ? (
        <p className="text-muted-foreground text-sm">—</p>
      ) : (
        <ul className="space-y-0.5 text-sm">
          {items.map((name) => (
            <li key={name}>{name}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
