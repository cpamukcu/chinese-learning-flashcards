"use client";

import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  DEFAULT_LEVEL,
  DEFAULT_SCENARIO,
  HSK_LEVELS,
  SCENARIOS,
} from "@/lib/tutor/scenarios";
import type { HskLevel, ScenarioId } from "@/lib/tutor/types";
import { cn } from "@/lib/utils";

export function SetupCard({
  onStart,
  extra,
  canStart = true,
}: {
  onStart: (scenario: ScenarioId, level: HskLevel) => void;
  // Extra section shown above the Start button (model settings in the static edition).
  extra?: ReactNode;
  canStart?: boolean;
}) {
  const [scenario, setScenario] = useState<ScenarioId>(DEFAULT_SCENARIO);
  const [level, setLevel] = useState<HskLevel>(DEFAULT_LEVEL);
  const levelHint = HSK_LEVELS.find((l) => l.level === level)?.hint;

  return (
    <div className="mx-auto w-full max-w-2xl space-y-8 px-4 py-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Today&apos;s session</h1>
        <p className="mt-1 text-muted-foreground">
          Pick a situation and your level. The tutor adapts to both.
        </p>
      </div>

      <section aria-labelledby="scenario-heading" className="space-y-3">
        <h2 id="scenario-heading" className="font-semibold">
          Scenario
        </h2>
        <div role="radiogroup" aria-labelledby="scenario-heading" className="grid grid-cols-2 gap-2.5">
          {SCENARIOS.map((s) => (
            <button
              key={s.id}
              type="button"
              role="radio"
              aria-checked={scenario === s.id}
              onClick={() => setScenario(s.id)}
              className={cn(
                "rounded-xl border p-3.5 text-left transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                scenario === s.id
                  ? "border-primary bg-accent ring-2 ring-primary/30"
                  : "border-border bg-card hover:bg-muted",
              )}
            >
              <span lang="zh-CN" className="font-zh block text-lg font-medium">
                {s.labelZh}
              </span>
              <span className="block text-sm font-medium">{s.label}</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">
                {s.description}
              </span>
            </button>
          ))}
        </div>
      </section>

      <section aria-labelledby="level-heading" className="space-y-3">
        <h2 id="level-heading" className="font-semibold">
          Your level
        </h2>
        <div role="radiogroup" aria-labelledby="level-heading" className="grid grid-cols-6 gap-2">
          {HSK_LEVELS.map(({ level: l }) => (
            <button
              key={l}
              type="button"
              role="radio"
              aria-checked={level === l}
              aria-label={`HSK ${l}`}
              onClick={() => setLevel(l)}
              className={cn(
                "h-12 rounded-xl border text-base font-semibold transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                level === l
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card hover:bg-muted",
              )}
            >
              {l}
            </button>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">
          HSK {level} · {levelHint}
        </p>
      </section>

      {extra}

      <Button
        size="lg"
        className="w-full"
        disabled={!canStart}
        onClick={() => onStart(scenario, level)}
      >
        Start conversation
      </Button>
      {!canStart && (
        <p className="-mt-4 text-center text-sm text-muted-foreground">
          Add your model details above to start.
        </p>
      )}
    </div>
  );
}
