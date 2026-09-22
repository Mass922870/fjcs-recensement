import { Check } from "lucide-react";
import { CENSUS_STEPS } from "@/schemas/youth";
import { cn } from "@/lib/utils";

interface StepperProps {
  current: number;
  maxReached: number;
  onSelect: (index: number) => void;
}

export function Stepper({ current, maxReached, onSelect }: StepperProps) {
  const total = CENSUS_STEPS.length;
  const percent = Math.round(((current + 1) / total) * 100);

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.14em] text-cyan-600 uppercase">
            Étape {current + 1} / {total}
          </p>
          <h1 className="text-foreground mt-1 text-2xl font-semibold sm:text-3xl">
            {CENSUS_STEPS[current]!.title}
          </h1>
        </div>
        <span className="text-muted-foreground text-sm font-medium tabular-nums">{percent}%</span>
      </div>

      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-label="Progression du formulaire"
        className="bg-muted h-1.5 w-full overflow-hidden rounded-full"
      >
        <div
          className="bg-brand-700 h-full rounded-full transition-[width] duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>

      <ol className="hidden gap-1 sm:flex" aria-label="Étapes">
        {CENSUS_STEPS.map((step, i) => {
          const done = i < current;
          const reachable = i <= maxReached;
          return (
            <li key={step.key} className="flex-1">
              <button
                type="button"
                disabled={!reachable}
                onClick={() => onSelect(i)}
                aria-current={i === current ? "step" : undefined}
                className={cn(
                  "flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors",
                  i === current
                    ? "bg-accent text-accent-foreground"
                    : reachable
                      ? "text-muted-foreground hover:bg-muted hover:text-foreground"
                      : "text-muted-foreground/60",
                )}
              >
                <span
                  className={cn(
                    "flex size-4.5 shrink-0 items-center justify-center rounded-full text-[10px]",
                    done
                      ? "bg-green-600 text-white"
                      : i === current
                        ? "bg-brand-700 text-white"
                        : "bg-muted text-muted-foreground",
                  )}
                >
                  {done ? <Check className="size-3" strokeWidth={3} /> : i + 1}
                </span>
                <span className="truncate">{step.short}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
