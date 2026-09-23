"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ACTION_PRIORITY_LABELS, ACTION_STATUS_LABELS } from "@/lib/constants/management";
import type { ActionPriority, ActionStatus } from "@/lib/generated/prisma/enums";
import type { CommissionRow } from "@/services/management/members.service";
import type { SelectableMember } from "@/services/management/meetings.service";

const ALL = "__tous__";
const STATUSES = Object.keys(ACTION_STATUS_LABELS) as ActionStatus[];
const PRIORITIES = Object.keys(ACTION_PRIORITY_LABELS) as ActionPriority[];
const DUE = { retard: "En retard", semaine: "Sous 7 jours", mois: "Sous 30 jours" } as const;
const KEYS = ["q", "status", "priority", "assigneeId", "commissionId", "due"];

export function ActionFilters({
  members,
  commissions,
}: {
  members: SelectableMember[];
  commissions: CommissionRow[];
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, start] = useTransition();

  const value = (key: string) => params.get(key) ?? ALL;
  const hasFilters = KEYS.some((k) => params.get(k));

  const apply = (key: string, next: string) => {
    const sp = new URLSearchParams(params.toString());
    if (!next || next === ALL) sp.delete(key);
    else sp.set(key, next);
    start(() => router.replace(`/management/actions?${sp.toString()}`));
  };

  const reset = () => {
    const sp = new URLSearchParams();
    const view = params.get("view");
    if (view) sp.set("view", view);
    start(() => router.replace(`/management/actions?${sp.toString()}`));
  };

  return (
    <div className="border-border grid gap-3 rounded-2xl border bg-white p-4 sm:grid-cols-2 lg:grid-cols-6">
      <form
        className="relative lg:col-span-2"
        onSubmit={(e) => {
          e.preventDefault();
          const v = new FormData(e.currentTarget).get("q");
          apply("q", typeof v === "string" ? v : "");
        }}
      >
        <Search
          className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
          aria-hidden
        />
        <Input
          name="q"
          defaultValue={params.get("q") ?? ""}
          placeholder="Rechercher une action"
          aria-label="Rechercher une action"
          className="pl-9"
        />
      </form>

      <Select value={value("assigneeId")} onValueChange={(v) => apply("assigneeId", v)}>
        <SelectTrigger aria-label="Filtrer par responsable">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Tous les responsables</SelectItem>
          {members.map((m) => (
            <SelectItem key={m.id} value={m.id}>
              {m.lastName} {m.firstName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={value("commissionId")} onValueChange={(v) => apply("commissionId", v)}>
        <SelectTrigger aria-label="Filtrer par commission">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Toutes les commissions</SelectItem>
          {commissions.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={value("priority")} onValueChange={(v) => apply("priority", v)}>
        <SelectTrigger aria-label="Filtrer par priorité">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Toutes les priorités</SelectItem>
          {PRIORITIES.map((p) => (
            <SelectItem key={p} value={p}>
              {ACTION_PRIORITY_LABELS[p]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={value("due")} onValueChange={(v) => apply("due", v)}>
        <SelectTrigger aria-label="Filtrer par échéance">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Toutes les échéances</SelectItem>
          {(Object.keys(DUE) as (keyof typeof DUE)[]).map((d) => (
            <SelectItem key={d} value={d}>
              {DUE[d]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={value("status")} onValueChange={(v) => apply("status", v)}>
        <SelectTrigger aria-label="Filtrer par état">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Tous les états</SelectItem>
          {STATUSES.map((s) => (
            <SelectItem key={s} value={s}>
              {ACTION_STATUS_LABELS[s]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilters ? (
        <Button variant="ghost" size="sm" disabled={pending} onClick={reset} className="lg:col-span-6">
          <X />
          Réinitialiser les filtres
        </Button>
      ) : null}
    </div>
  );
}
