"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { setFormOpenAction } from "@/actions/settings";

/** Interrupteur à effet immédiat : ouvre / ferme le formulaire public dès le clic. */
export function FormOpenToggle({ initialOpen }: { initialOpen: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(initialOpen);
  const [pending, start] = useTransition();

  const toggle = (next: boolean) => {
    const previous = open;
    setOpen(next);
    start(async () => {
      const res = await setFormOpenAction(next);
      if (res.ok) {
        toast.success(
          next
            ? "Formulaire public ouvert : les inscriptions sont acceptées."
            : "Formulaire public fermé : les inscriptions sont suspendues.",
        );
        router.refresh();
      } else {
        setOpen(previous);
        toast.error(res.error);
      }
    });
  };

  return (
    <section className="border-border flex items-start justify-between gap-4 rounded-2xl border bg-white p-5">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h2 className="text-foreground text-sm font-semibold">Formulaire public</h2>
          <Badge
            variant="outline"
            className={
              open
                ? "border-green-100 bg-green-50 text-green-700"
                : "border-amber-200 bg-amber-50 text-amber-800"
            }
          >
            {open ? "Ouvert" : "Fermé"}
          </Badge>
          {pending ? <Loader2 className="text-muted-foreground size-4 animate-spin" /> : null}
        </div>
        <p className="text-muted-foreground text-sm">
          {open
            ? "Les jeunes peuvent s'inscrire sur /recensement. Désactivez pour suspendre temporairement les inscriptions - effet immédiat."
            : "Les inscriptions sont suspendues : /recensement affiche un message de fermeture. Réactivez pour rouvrir - effet immédiat."}
        </p>
      </div>
      <Switch
        id="formOpen"
        checked={open}
        onCheckedChange={toggle}
        disabled={pending}
        aria-label="Formulaire public ouvert"
        className="mt-0.5 shrink-0"
      />
    </section>
  );
}
