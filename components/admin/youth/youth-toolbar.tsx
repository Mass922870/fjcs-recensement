"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Loader2, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PROFILE_STATUS_LABELS } from "@/lib/constants/referentials";
import type { ProfileStatus } from "@/lib/generated/prisma/enums";

interface Props {
  q?: string;
  status: ProfileStatus;
  canSeeArchived: boolean;
}

export function YouthToolbar({ q = "", status, canSeeArchived }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [value, setValue] = useState(q);

  const push = (patch: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (!v) params.delete(k);
      else params.set(k, v);
    }
    params.delete("page");
    startTransition(() => router.replace(`${pathname}?${params.toString()}`, { scroll: false }));
  };

  // Recherche avec léger délai pour ne pas requêter à chaque frappe.
  useEffect(() => {
    if (value === q) return;
    const t = window.setTimeout(() => push({ q: value.trim() || undefined }), 350);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Nom, prénom, téléphone ou identifiant…"
          aria-label="Rechercher un jeune"
          className="h-10 pr-9 pl-9"
        />
        {pending ? (
          <Loader2 className="text-muted-foreground absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin" />
        ) : value ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            className="absolute top-1/2 right-2 -translate-y-1/2"
            onClick={() => setValue("")}
            aria-label="Effacer la recherche"
          >
            <X />
          </Button>
        ) : null}
      </div>
      {canSeeArchived ? (
        <Select
          value={status}
          onValueChange={(v) => push({ status: v === "ACTIVE" ? undefined : v })}
        >
          <SelectTrigger className="h-10 w-full sm:w-44" aria-label="Statut des profils">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(PROFILE_STATUS_LABELS) as ProfileStatus[]).map((s) => (
              <SelectItem key={s} value={s}>
                {PROFILE_STATUS_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : null}
    </div>
  );
}
