"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AgendaEditor, emptyAgendaItem, type AgendaDraft } from "./agenda-editor";
import { ParticipantPicker } from "./participant-picker";
import { MEETING_TYPE_LABELS } from "@/lib/constants/management";
import type { MeetingType } from "@/lib/generated/prisma/enums";
import { createMeetingAction, updateMeetingAction } from "@/actions/management/meetings";
import type { CommissionRow } from "@/services/management/members.service";
import type { MeetingDetail, SelectableMember } from "@/services/management/meetings.service";

const TYPES = Object.keys(MEETING_TYPE_LABELS) as MeetingType[];
const NONE = "__aucune__";

interface Props {
  commissions: CommissionRow[];
  members: SelectableMember[];
  meeting?: MeetingDetail;
  /** Date pré-remplie lorsqu'on crée depuis le calendrier. */
  defaultDate?: string;
}

/** "2026-09-23T15:00:00" → "15:00", en heure locale. */
function timeOf(date: Date | null): string {
  if (!date) return "";
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function dateOf(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;
}

export function MeetingForm({ commissions, members, meeting, defaultDate }: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);

  const [type, setType] = useState<MeetingType>(meeting?.type ?? "BUREAU");
  const [commissionId, setCommissionId] = useState(meeting?.commission?.id ?? NONE);
  const [organizerId, setOrganizerId] = useState(meeting?.organizer?.id ?? NONE);
  const [agenda, setAgenda] = useState<AgendaDraft[]>(
    meeting?.agenda.length
      ? meeting.agenda.map((a) => ({
          key: a.id,
          title: a.title,
          description: a.description ?? "",
          duration: a.duration ? String(a.duration) : "",
        }))
      : [emptyAgendaItem()],
  );
  const [participantIds, setParticipantIds] = useState<string[]>(
    meeting?.participants.map((p) => p.member.id) ?? [],
  );

  const editing = Boolean(meeting);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const fd = new FormData(event.currentTarget);
    const values = {
      title: fd.get("title"),
      type,
      date: fd.get("date"),
      startTime: fd.get("startTime"),
      endTime: fd.get("endTime"),
      location: fd.get("location"),
      description: fd.get("description"),
      commissionId: commissionId === NONE ? "" : commissionId,
      organizerId: organizerId === NONE ? "" : organizerId,
      // Les points laissés entièrement vides ne sont pas enregistrés.
      agenda: agenda
        .filter((a) => a.title.trim())
        .map((a) => ({ title: a.title, description: a.description, duration: a.duration })),
      participantIds,
    };

    setErrors({});
    setGlobalError(null);
    start(async () => {
      const res = meeting
        ? await updateMeetingAction(meeting.id, values)
        : await createMeetingAction(values);
      if (res.ok) {
        toast.success(editing ? "Réunion mise à jour." : "Réunion créée.");
        const id = meeting?.id ?? (res.data as { id: string }).id;
        router.push(`/management/reunions/${id}`);
        router.refresh();
      } else {
        setErrors(res.fieldErrors ?? {});
        if (!res.fieldErrors) setGlobalError(res.error);
        else toast.error(res.error);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      <section className="border-border space-y-4 rounded-2xl border bg-white p-5">
        <h2 className="text-foreground text-sm font-semibold">Informations générales</h2>

        <Field>
          <FieldLabel htmlFor="title">Intitulé de la réunion</FieldLabel>
          <Input
            id="title"
            name="title"
            defaultValue={meeting?.title}
            placeholder="Réunion ordinaire du bureau"
            required
          />
          <FieldError>{errors.title?.[0]}</FieldError>
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="type">Type</FieldLabel>
            <Select value={type} onValueChange={(v) => setType(v as MeetingType)}>
              <SelectTrigger id="type" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {MEETING_TYPE_LABELS[t]}
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
                {commissions
                  .filter((c) => c.isActive || c.id === meeting?.commission?.id)
                  .map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <FieldError>{errors.commissionId?.[0]}</FieldError>
            {type === "COMMISSION" ? (
              <FieldDescription>Obligatoire pour une réunion de commission.</FieldDescription>
            ) : null}
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field>
            <FieldLabel htmlFor="date">Date</FieldLabel>
            <Input
              id="date"
              name="date"
              type="date"
              required
              defaultValue={meeting ? dateOf(meeting.startsAt) : defaultDate}
            />
            <FieldError>{errors.date?.[0]}</FieldError>
          </Field>
          <Field>
            <FieldLabel htmlFor="startTime">Heure de début</FieldLabel>
            <Input
              id="startTime"
              name="startTime"
              type="time"
              required
              defaultValue={meeting ? timeOf(meeting.startsAt) : "17:00"}
            />
            <FieldError>{errors.startTime?.[0]}</FieldError>
          </Field>
          <Field>
            <FieldLabel htmlFor="endTime">Fin prévue</FieldLabel>
            <Input
              id="endTime"
              name="endTime"
              type="time"
              defaultValue={meeting ? timeOf(meeting.endsAt) : ""}
            />
            <FieldError>{errors.endTime?.[0]}</FieldError>
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="location">Lieu</FieldLabel>
            <Input
              id="location"
              name="location"
              defaultValue={meeting?.location ?? ""}
              placeholder="Siège du FJCS, Sangalkam"
            />
            <FieldError>{errors.location?.[0]}</FieldError>
          </Field>
          <Field>
            <FieldLabel htmlFor="organizer">Organisateur</FieldLabel>
            <Select value={organizerId} onValueChange={setOrganizerId}>
              <SelectTrigger id="organizer" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Non précisé</SelectItem>
                {members.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.lastName} {m.firstName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError>{errors.organizerId?.[0]}</FieldError>
          </Field>
        </div>

        <Field>
          <FieldLabel htmlFor="description">Objet de la séance</FieldLabel>
          <Textarea
            id="description"
            name="description"
            rows={3}
            defaultValue={meeting?.description ?? ""}
            placeholder="Contexte, objectif, éléments à préparer…"
          />
          <FieldError>{errors.description?.[0]}</FieldError>
        </Field>
      </section>

      <section className="border-border space-y-4 rounded-2xl border bg-white p-5">
        <div>
          <h2 className="text-foreground text-sm font-semibold">Ordre du jour</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Les points se réordonnent par glisser-déposer ou avec les flèches. Ils serviront de
            structure au procès-verbal.
          </p>
        </div>
        <AgendaEditor items={agenda} onChange={setAgenda} errors={errors} />
      </section>

      <section className="border-border space-y-4 rounded-2xl border bg-white p-5">
        <div>
          <h2 className="text-foreground text-sm font-semibold">Participants attendus</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            La convocation liste les membres attendus. La présence réelle se pointera le jour de la
            séance.
          </p>
        </div>
        <ParticipantPicker
          members={members}
          selected={participantIds}
          onChange={setParticipantIds}
        />
      </section>

      {globalError ? (
        <Alert variant="destructive">
          <AlertDescription>{globalError}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button type="button" variant="ghost" onClick={() => router.back()} disabled={pending}>
          Annuler
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? <Loader2 data-icon="inline-start" className="animate-spin" /> : null}
          {editing ? "Enregistrer les modifications" : "Créer la réunion"}
        </Button>
      </div>
    </form>
  );
}
