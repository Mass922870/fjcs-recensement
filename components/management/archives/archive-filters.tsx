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
import { MEETING_TYPE_LABELS } from "@/lib/constants/management";
import type { MeetingType } from "@/lib/generated/prisma/enums";
import type { CommissionRow } from "@/services/management/members.service";

const ALL = "__tous__";
const TYPES = Object.keys(MEETING_TYPE_LABELS) as MeetingType[];
const KEYS = ["q", "year", "type", "commissionId"];

export function ArchiveFilters({
  years,
  commissions,
}: {
  years: number[];
  commissions: CommissionRow[];
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, start] = useTransition();

  const apply = (key: string, next: string) => {
    const sp = new URLSearchParams(params.toString());
    if (!next || next === ALL) sp.delete(key);
    else sp.set(key, next);
    start(() => router.replace(`/management/archives?${sp.toString()}`));
  };

  return (
    <div className="border-border grid gap-3 rounded-2xl border bg-white p-4 sm:grid-cols-2 lg:grid-cols-5">
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
          placeholder="Séance, référence, point de l'ordre du jour, décision"
          aria-label="Rechercher dans les archives"
          className="pl-9"
        />
      </form>

      <Select value={params.get("year") ?? ALL} onValueChange={(v) => apply("year", v)}>
        <SelectTrigger aria-label="Filtrer par année">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Toutes les années</SelectItem>
          {years.map((y) => (
            <SelectItem key={y} value={String(y)}>
              {y}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={params.get("type") ?? ALL} onValueChange={(v) => apply("type", v)}>
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

      <Select
        value={params.get("commissionId") ?? ALL}
        onValueChange={(v) => apply("commissionId", v)}
      >
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

      {KEYS.some((k) => params.get(k)) ? (
        <Button
          variant="ghost"
          size="sm"
          disabled={pending}
          onClick={() => start(() => router.replace("/management/archives"))}
          className="lg:col-span-5"
        >
          <X />
          Réinitialiser
        </Button>
      ) : null}
    </div>
  );
}
