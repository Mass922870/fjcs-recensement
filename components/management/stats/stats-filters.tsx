"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
const KEYS = ["from", "to", "commissionId", "type"];

export function MeetingTypeFilter({ commissions }: { commissions: CommissionRow[] }) {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, start] = useTransition();

  const apply = (key: string, next: string) => {
    const sp = new URLSearchParams(params.toString());
    if (!next || next === ALL) sp.delete(key);
    else sp.set(key, next);
    start(() => router.replace(`/management/statistiques?${sp.toString()}`));
  };

  return (
    <div className="border-border grid gap-3 rounded-2xl border bg-white p-4 sm:grid-cols-2 lg:grid-cols-5">
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

      <div className="space-y-1">
        <Label className="text-muted-foreground text-xs">Commission</Label>
        <Select
          value={params.get("commissionId") ?? ALL}
          onValueChange={(v) => apply("commissionId", v)}
        >
          <SelectTrigger aria-label="Filtrer par commission">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Toutes</SelectItem>
            {commissions.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label className="text-muted-foreground text-xs">Type de réunion</Label>
        <Select value={params.get("type") ?? ALL} onValueChange={(v) => apply("type", v)}>
          <SelectTrigger aria-label="Filtrer par type de réunion">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Tous</SelectItem>
            {TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {MEETING_TYPE_LABELS[t]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {KEYS.some((k) => params.get(k)) ? (
        <Button
          variant="ghost"
          size="sm"
          disabled={pending}
          onClick={() => start(() => router.replace("/management/statistiques"))}
          className="self-end"
        >
          <X />
          Réinitialiser
        </Button>
      ) : null}
    </div>
  );
}
