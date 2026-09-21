import { ArrowRight, Check } from "lucide-react";
import type { TutorCorrection } from "@/lib/tutor/types";

export function CorrectionCard({ correction }: { correction: TutorCorrection }) {
  return (
    <div className="w-full max-w-[90%] rounded-2xl border border-accent bg-accent/60 px-4 py-3 sm:max-w-[80%]">
      <p className="text-xs font-semibold uppercase tracking-wide text-accent-foreground">
        Gentle correction
      </p>
      <p
        lang="zh-CN"
        className="font-zh mt-1.5 flex flex-wrap items-center gap-x-2 text-lg"
      >
        <span className="text-muted-foreground line-through decoration-primary/60">
          {correction.original}
        </span>
        <ArrowRight className="size-4 shrink-0 text-primary" aria-label="better:" />
        <span className="font-medium">{correction.better}</span>
      </p>
      {correction.explanation && (
        <p className="mt-1 text-sm text-accent-foreground/80">
          {correction.explanation}
        </p>
      )}
    </div>
  );
}

export function NoCorrection() {
  return (
    <p className="flex items-center gap-1 text-xs text-muted-foreground">
      <Check className="size-3.5 text-primary" aria-hidden />
      Sounds natural
    </p>
  );
}
