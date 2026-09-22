"use client";

import { useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeftRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CROSS_DIMENSIONS, type CrossDimension } from "@/lib/constants/stats";

interface Props {
  x: CrossDimension;
  y: CrossDimension;
}

const DIMS = Object.entries(CROSS_DIMENSIONS) as [CrossDimension, string][];

export function CrossTabControls({ x, y }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [pending, startTransition] = useTransition();

  const set = (patch: { x?: string; y?: string }) => {
    const params = new URLSearchParams(sp.toString());
    if (patch.x) params.set("x", patch.x);
    if (patch.y) params.set("y", patch.y);
    startTransition(() => router.replace(`${pathname}?${params.toString()}`, { scroll: false }));
  };

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="flex-1 space-y-1.5">
        <Label className="text-muted-foreground text-xs">Lignes</Label>
        <Select value={x} onValueChange={(v) => set({ x: v })}>
          <SelectTrigger className="h-10 w-full" aria-label="Dimension des lignes">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DIMS.map(([k, label]) => (
              <SelectItem key={k} value={k} disabled={k === y}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-10 shrink-0"
        aria-label="Inverser lignes et colonnes"
        onClick={() => set({ x: y, y: x })}
      >
        {pending ? <Loader2 className="animate-spin" /> : <ArrowLeftRight />}
      </Button>
      <div className="flex-1 space-y-1.5">
        <Label className="text-muted-foreground text-xs">Colonnes</Label>
        <Select value={y} onValueChange={(v) => set({ y: v })}>
          <SelectTrigger className="h-10 w-full" aria-label="Dimension des colonnes">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DIMS.map(([k, label]) => (
              <SelectItem key={k} value={k} disabled={k === x}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
