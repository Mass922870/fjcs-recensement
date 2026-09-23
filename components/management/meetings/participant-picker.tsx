"use client";

import { useMemo, useState } from "react";
import { Check, Search, Users, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { SelectableMember } from "@/services/management/meetings.service";

interface Props {
  members: SelectableMember[];
  selected: string[];
  onChange: (ids: string[]) => void;
}

export function ParticipantPicker({ members, selected, onChange }: Props) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return members;
    return members.filter((m) =>
      `${m.firstName} ${m.lastName} ${m.role ?? ""} ${m.commission?.name ?? ""}`
        .toLowerCase()
        .includes(q),
    );
  }, [members, query]);

  const selectedSet = new Set(selected);
  const toggle = (id: string) =>
    onChange(selectedSet.has(id) ? selected.filter((s) => s !== id) : [...selected, id]);

  const commissions = useMemo(
    () =>
      [...new Map(members.filter((m) => m.commission).map((m) => [m.commission!.id, m.commission!])).values()],
    [members],
  );

  /** Convoque une commission entière sans décocher les autres sélections. */
  const selectCommission = (commissionId: string) => {
    const ids = members.filter((m) => m.commission?.id === commissionId).map((m) => m.id);
    onChange([...new Set([...selected, ...ids])]);
  };

  if (members.length === 0) {
    return (
      <p className="text-muted-foreground border-border rounded-xl border border-dashed px-4 py-6 text-center text-sm">
        Aucun membre enregistré. Ajoutez d&apos;abord des membres pour pouvoir les convoquer.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-48 flex-1">
          <Search
            className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
            aria-hidden
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un membre"
            aria-label="Rechercher un membre à convoquer"
            className="pl-9"
          />
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => onChange(members.map((m) => m.id))}>
          <Users />
          Tout convoquer
        </Button>
        {selected.length > 0 ? (
          <Button type="button" variant="ghost" size="sm" onClick={() => onChange([])}>
            <X />
            Vider
          </Button>
        ) : null}
      </div>

      {commissions.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {commissions.map((c) => (
            <Button
              key={c.id}
              type="button"
              variant="secondary"
              size="sm"
              className="h-7 text-xs"
              onClick={() => selectCommission(c.id)}
            >
              + {c.name}
            </Button>
          ))}
        </div>
      ) : null}

      <ScrollArea className="border-border h-64 rounded-xl border bg-white">
        <ul className="divide-border divide-y">
          {filtered.map((m) => {
            const isSelected = selectedSet.has(m.id);
            return (
              <li key={m.id}>
                <button
                  type="button"
                  onClick={() => toggle(m.id)}
                  aria-pressed={isSelected}
                  className={cn(
                    "hover:bg-muted/50 flex w-full items-center gap-3 px-3 py-2 text-left transition-colors",
                    isSelected && "bg-brand-50/60",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-5 shrink-0 items-center justify-center rounded border transition-colors",
                      isSelected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border",
                    )}
                    aria-hidden
                  >
                    {isSelected ? <Check className="size-3.5" /> : null}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="text-foreground block truncate text-sm font-medium">
                      {m.lastName} {m.firstName}
                    </span>
                    <span className="text-muted-foreground block truncate text-xs">
                      {m.role ?? "Membre"}
                      {m.commission ? ` · ${m.commission.name}` : ""}
                    </span>
                  </span>
                  {m.status === "INACTIF" ? (
                    <Badge variant="secondary" className="shrink-0 text-[10px]">
                      inactif
                    </Badge>
                  ) : null}
                </button>
              </li>
            );
          })}
          {filtered.length === 0 ? (
            <li className="text-muted-foreground px-3 py-6 text-center text-sm">
              Aucun membre ne correspond.
            </li>
          ) : null}
        </ul>
      </ScrollArea>

      <p className="text-muted-foreground text-sm">
        {selected.length === 0
          ? "Aucun membre convoqué pour l'instant."
          : `${selected.length} membre${selected.length > 1 ? "s" : ""} convoqué${selected.length > 1 ? "s" : ""}.`}
      </p>
    </div>
  );
}
