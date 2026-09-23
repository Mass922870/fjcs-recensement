"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, GripVertical, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export interface AgendaDraft {
  key: string;
  title: string;
  description: string;
  duration: string;
}

export function emptyAgendaItem(): AgendaDraft {
  return { key: crypto.randomUUID(), title: "", description: "", duration: "" };
}

interface Props {
  items: AgendaDraft[];
  onChange: (items: AgendaDraft[]) => void;
  errors?: Record<string, string[] | undefined>;
}

/**
 * Ordre du jour : ajout, suppression et réordonnancement.
 *
 * Le glisser-déposer natif est doublé de boutons haut/bas. C'est volontaire :
 * le glisser-déposer HTML ne fonctionne pas au doigt sur téléphone et n'est
 * pas utilisable au clavier, or l'un et l'autre sont indispensables ici.
 */
export function AgendaEditor({ items, onChange, errors }: Props) {
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  const update = (index: number, patch: Partial<AgendaDraft>) =>
    onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));

  const remove = (index: number) => onChange(items.filter((_, i) => i !== index));

  const move = (from: number, to: number) => {
    if (to < 0 || to >= items.length || from === to) return;
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved!);
    onChange(next);
  };

  return (
    <div className="space-y-3">
      {items.length === 0 ? (
        <p className="text-muted-foreground border-border rounded-xl border border-dashed px-4 py-6 text-center text-sm">
          Aucun point à l&apos;ordre du jour. Ajoutez-en un pour structurer la séance et le futur
          procès-verbal.
        </p>
      ) : null}

      <ol className="space-y-3">
        {items.map((item, index) => (
          <li
            key={item.key}
            draggable
            onDragStart={() => setDraggingIndex(index)}
            onDragEnd={() => {
              setDraggingIndex(null);
              setOverIndex(null);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setOverIndex(index);
            }}
            onDrop={(e) => {
              e.preventDefault();
              if (draggingIndex !== null) move(draggingIndex, index);
              setDraggingIndex(null);
              setOverIndex(null);
            }}
            className={cn(
              "border-border rounded-xl border bg-white p-3 transition-shadow",
              draggingIndex === index && "opacity-50",
              overIndex === index && draggingIndex !== index && "ring-primary/40 ring-2",
            )}
          >
            <div className="flex items-start gap-2">
              <span
                className="text-muted-foreground mt-2 hidden cursor-grab active:cursor-grabbing sm:block"
                aria-hidden
              >
                <GripVertical className="size-4" />
              </span>
              <span className="bg-brand-50 text-brand-700 mt-1.5 flex size-6 shrink-0 items-center justify-center rounded-md text-xs font-semibold">
                {index + 1}
              </span>

              <div className="min-w-0 flex-1 space-y-2">
                <Input
                  value={item.title}
                  onChange={(e) => update(index, { title: e.target.value })}
                  placeholder="Sujet du point"
                  aria-label={`Sujet du point ${index + 1}`}
                />
                {errors?.[`agenda.${index}.title`] ? (
                  <p className="text-destructive text-xs">
                    {errors[`agenda.${index}.title`]?.[0]}
                  </p>
                ) : null}
                <div className="grid gap-2 sm:grid-cols-[1fr_140px]">
                  <Textarea
                    value={item.description}
                    onChange={(e) => update(index, { description: e.target.value })}
                    placeholder="Précisions (facultatif)"
                    aria-label={`Précisions du point ${index + 1}`}
                    rows={2}
                  />
                  <Input
                    value={item.duration}
                    onChange={(e) => update(index, { duration: e.target.value })}
                    inputMode="numeric"
                    placeholder="Durée (min)"
                    aria-label={`Durée du point ${index + 1} en minutes`}
                  />
                </div>
              </div>

              <div className="flex shrink-0 flex-col gap-0.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  disabled={index === 0}
                  aria-label={`Monter le point ${index + 1}`}
                  onClick={() => move(index, index - 1)}
                >
                  <ArrowUp className="size-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  disabled={index === items.length - 1}
                  aria-label={`Descendre le point ${index + 1}`}
                  onClick={() => move(index, index + 1)}
                >
                  <ArrowDown className="size-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  aria-label={`Supprimer le point ${index + 1}`}
                  onClick={() => remove(index)}
                >
                  <Trash2 className="text-destructive size-3.5" />
                </Button>
              </div>
            </div>
          </li>
        ))}
      </ol>

      <Button type="button" variant="outline" onClick={() => onChange([...items, emptyAgendaItem()])}>
        <Plus />
        Ajouter un point
      </Button>
    </div>
  );
}
