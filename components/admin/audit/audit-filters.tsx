"use client";

import { useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AUDIT_ACTION_LABELS } from "@/lib/constants/audit";
import type { AuditAction } from "@/lib/generated/prisma/enums";
import type { AuditListParams } from "@/services/audit-list.service";

const ALL = "__all__";

export function AuditFilters({
  params,
  actors,
}: {
  params: AuditListParams;
  actors: { id: string; name: string }[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [pending, start] = useTransition();

  const update = (patch: Record<string, string | undefined>) => {
    const p = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (!v || v === ALL) p.delete(k);
      else p.set(k, v);
    }
    p.delete("page");
    start(() => router.replace(`${pathname}?${p.toString()}`, { scroll: false }));
  };
  const active = Boolean(params.action || params.actor || params.from || params.to);

  return (
    <div className="border-border mb-4 rounded-2xl border bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="flex items-center gap-2 text-sm font-medium">
          Filtres{" "}
          {pending ? <Loader2 className="text-muted-foreground size-4 animate-spin" /> : null}
        </p>
        {active ? (
          <Button variant="ghost" size="sm" onClick={() => start(() => router.replace(pathname))}>
            <RotateCcw data-icon="inline-start" />
            Réinitialiser
          </Button>
        ) : null}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-1.5">
          <Label className="text-muted-foreground text-xs">Action</Label>
          <Select value={params.action ?? ALL} onValueChange={(v) => update({ action: v })}>
            <SelectTrigger className="h-9 w-full">
              <SelectValue placeholder="Toutes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Toutes</SelectItem>
              {(Object.keys(AUDIT_ACTION_LABELS) as AuditAction[]).map((a) => (
                <SelectItem key={a} value={a}>
                  {AUDIT_ACTION_LABELS[a]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-muted-foreground text-xs">Auteur</Label>
          <Select value={params.actor ?? ALL} onValueChange={(v) => update({ actor: v })}>
            <SelectTrigger className="h-9 w-full">
              <SelectValue placeholder="Tous" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Tous</SelectItem>
              {actors.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-muted-foreground text-xs">Du</Label>
          <Input
            type="date"
            className="h-9"
            value={params.from ?? ""}
            onChange={(e) => update({ from: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-muted-foreground text-xs">Au</Label>
          <Input
            type="date"
            className="h-9"
            value={params.to ?? ""}
            onChange={(e) => update({ to: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
}
