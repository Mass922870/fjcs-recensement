"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MEETING_STATUS_LABELS, MEETING_TYPE_LABELS } from "@/lib/constants/management";
import type { MeetingStatus, MeetingType } from "@/lib/generated/prisma/enums";
import type { CommissionRow } from "@/services/management/members.service";

const ALL = "__tous__";
const STATUSES = Object.keys(MEETING_STATUS_LABELS) as MeetingStatus[];
const TYPES = Object.keys(MEETING_TYPE_LABELS) as MeetingType[];

const SORTS = {
  "date-desc": "Plus récentes",
  "date-asc": "Plus anciennes",
  title: "Titre (A-Z)",
} as const;

const FILTER_KEYS = ["q", "status", "type", "commissionId", "from", "to", "sort"];

export function MeetingFilters({ commissions }: { commissions: CommissionRow[] }) {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, start] = useTransition();

  const value = (key: string, fallback = ALL) => params.get(key) ?? fallback;
  const hasFilters = FILTER_KEYS.some((k) => params.get(k));

  /** Toute modification de filtre ramène à la première page. */
  const apply = (key: string, next: string) => {
    const sp = new URLSearchParams(params.toString());
    if (!next || next === ALL) sp.delete(key);
    else sp.set(key, next);
    sp.delete("page");
    start(() => router.replace(`/management/reunions?${sp.toString()}`));
  };

  return (
    <div className="border-border space-y-3 rounded-2xl border bg-white p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <form
          className="relative flex-1"
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
            placeholder="Titre, référence ou lieu"
            aria-label="Rechercher une réunion"
            className="pl-9"
          />
        </form>

        <Select value={value("sort", "date-desc")} onValueChange={(v) => apply("sort", v)}>
          <SelectTrigger className="sm:w-44" aria-label="Trier">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(SORTS) as (keyof typeof SORTS)[]).map((s) => (
              <SelectItem key={s} value={s}>
                {SORTS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasFilters ? (
          <Button
            variant="ghost"
            size="sm"
            disabled={pending}
            onClick={() => start(() => router.replace("/management/reunions"))}
          >
            <X />
            Réinitialiser
          </Button>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Select value={value("status")} onValueChange={(v) => apply("status", v)}>
          <SelectTrigger aria-label="Filtrer par statut">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Tous les statuts</SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {MEETING_STATUS_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={value("type")} onValueChange={(v) => apply("type", v)}>
          <SelectTrigger aria-label="Filtrer par type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Tous les types</SelectItem>
            {TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {MEETING_TYPE_LABELS[t]}
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

        <div className="space-y-1">
          <Label htmlFor="from" className="text-muted-foreground text-xs">
            Du
          </Label>
          <Input
            id="from"
            type="date"
            defaultValue={params.get("from") ?? ""}
            onChange={(e) => apply("from", e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="to" className="text-muted-foreground text-xs">
            Au
          </Label>
          <Input
            id="to"
            type="date"
            defaultValue={params.get("to") ?? ""}
            onChange={(e) => apply("to", e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
