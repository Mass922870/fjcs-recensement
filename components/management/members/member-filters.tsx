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
import { MEMBER_STATUS_LABELS } from "@/lib/constants/management";
import type { MemberStatus } from "@/lib/generated/prisma/enums";
import type { CommissionRow } from "@/services/management/members.service";

const ALL = "__tous__";
const STATUSES = Object.keys(MEMBER_STATUS_LABELS) as MemberStatus[];

export function MemberFilters({ commissions }: { commissions: CommissionRow[] }) {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, start] = useTransition();

  const current = {
    q: params.get("q") ?? "",
    status: params.get("status") ?? ALL,
    commissionId: params.get("commissionId") ?? ALL,
  };
  const hasFilters = Boolean(params.get("q") || params.get("status") || params.get("commissionId"));

  /** Toute modification remet la pagination à la première page. */
  const apply = (key: string, value: string) => {
    const next = new URLSearchParams(params.toString());
    if (!value || value === ALL) next.delete(key);
    else next.set(key, value);
    next.delete("page");
    start(() => router.replace(`/management/membres?${next.toString()}`));
  };

  return (
    <div className="border-border flex flex-col gap-3 rounded-2xl border bg-white p-4 sm:flex-row sm:items-center">
      <form
        className="relative flex-1"
        onSubmit={(e) => {
          e.preventDefault();
          const value = new FormData(e.currentTarget).get("q");
          apply("q", typeof value === "string" ? value : "");
        }}
      >
        <Search
          className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
          aria-hidden
        />
        <Input
          name="q"
          defaultValue={current.q}
          placeholder="Nom, téléphone ou adresse e-mail"
          aria-label="Rechercher un membre"
          className="pl-9"
        />
      </form>

      <Select value={current.status} onValueChange={(v) => apply("status", v)}>
        <SelectTrigger className="sm:w-44" aria-label="Filtrer par statut">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Tous les statuts</SelectItem>
          {STATUSES.map((s) => (
            <SelectItem key={s} value={s}>
              {MEMBER_STATUS_LABELS[s]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={current.commissionId} onValueChange={(v) => apply("commissionId", v)}>
        <SelectTrigger className="sm:w-52" aria-label="Filtrer par commission">
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

      {hasFilters ? (
        <Button
          variant="ghost"
          size="sm"
          disabled={pending}
          onClick={() => start(() => router.replace("/management/membres"))}
        >
          <X />
          Réinitialiser
        </Button>
      ) : null}
    </div>
  );
}
