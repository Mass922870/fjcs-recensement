"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { confirmPresenceAction, type PresenceConfirmation } from "@/actions/management/attendance";
import { cn } from "@/lib/utils";

interface Props {
  token: string;
  meetingTitle: string;
  members: { id: string; firstName: string; lastName: string }[];
}

export function PresenceConfirm({ token, meetingTitle, members }: Props) {
  const [pending, start] = useTransition();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<PresenceConfirmation | null>(null);

  const filtered = members.filter((m) =>
    `${m.firstName} ${m.lastName}`.toLowerCase().includes(query.trim().toLowerCase()),
  );
  const chosen = members.find((m) => m.id === selected) ?? null;

  const confirm = () => {
    if (!selected) return;
    setError(null);
    start(async () => {
      const res = await confirmPresenceAction({ token, memberId: selected });
      if (res.ok) setDone(res.data ?? null);
      else setError(res.error);
    });
  };

  if (done) {
    return (
      <div className="animate-in fade-in zoom-in-95 space-y-5 text-center duration-500 motion-reduce:animate-none">
        <span className="mx-auto flex size-20 items-center justify-center rounded-full bg-green-50 text-green-600">
          <CheckCircle2 className="size-10" aria-hidden />
        </span>
        <div className="space-y-2">
          <h2 className="text-foreground text-2xl font-semibold">Présence enregistrée</h2>
          <p className="text-muted-foreground">
            {done.memberName}, votre présence à « {done.meetingTitle} » est bien enregistrée
            {done.late ? ", avec la mention retard" : ""}.
          </p>
          <p className="text-muted-foreground text-sm">
            {new Date(done.at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
        <p className="text-muted-foreground text-xs">
          Une erreur ? Signalez-la au responsable de séance, qui peut corriger la feuille.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="text-center">
        <p className="text-muted-foreground text-xs font-semibold tracking-[0.18em] uppercase">
          Réunion FJCS
        </p>
        <h2 className="text-foreground mt-1 text-xl font-semibold">{meetingTitle}</h2>
        <p className="text-muted-foreground mt-2 text-sm">
          Sélectionnez votre nom pour confirmer votre présence.
        </p>
      </div>

      {members.length === 0 ? (
        <Alert>
          <AlertDescription>
            Toutes les présences de cette séance sont déjà enregistrées. Voyez le responsable si ce
            n&apos;est pas le cas pour vous.
          </AlertDescription>
        </Alert>
      ) : (
        <>
          {members.length > 8 ? (
            <div className="relative">
              <Search
                className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
                aria-hidden
              />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher votre nom"
                aria-label="Rechercher votre nom"
                className="h-12 pl-9"
              />
            </div>
          ) : null}

          <ul className="border-border divide-border max-h-80 divide-y overflow-y-auto rounded-2xl border bg-white">
            {filtered.map((m) => (
              <li key={m.id}>
                <button
                  type="button"
                  onClick={() => setSelected(m.id)}
                  aria-pressed={selected === m.id}
                  className={cn(
                    "w-full px-4 py-3.5 text-left text-base transition-colors",
                    selected === m.id ? "bg-brand-50 font-medium" : "hover:bg-muted/50",
                  )}
                >
                  {m.lastName} {m.firstName}
                </button>
              </li>
            ))}
            {filtered.length === 0 ? (
              <li className="text-muted-foreground px-4 py-6 text-center text-sm">
                Aucun nom ne correspond.
              </li>
            ) : null}
          </ul>

          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <Button
            onClick={confirm}
            disabled={!selected || pending}
            className="h-12 w-full text-base"
          >
            {pending ? <Loader2 data-icon="inline-start" className="animate-spin" /> : null}
            {chosen ? `Confirmer ma présence — ${chosen.firstName}` : "Confirmer ma présence"}
          </Button>
        </>
      )}
    </div>
  );
}
