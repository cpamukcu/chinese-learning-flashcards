"use client";

import { Gauge, Volume2, VolumeX } from "lucide-react";
import type { VoicePreferences } from "@/lib/voice/preferences";
import { cn } from "@/lib/utils";

const pill =
  "inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none";

// Whether the tutor speaks its replies, and how fast.
export function VoiceToggles({
  prefs,
  onChange,
}: {
  prefs: VoicePreferences;
  // Takes an updater so quick successive clicks never overwrite each other.
  onChange: (update: (prefs: VoicePreferences) => VoicePreferences) => void;
}) {
  const slow = prefs.speed === "slow";
  return (
    <div role="group" aria-label="Voice" className="flex gap-2">
      <button
        type="button"
        aria-pressed={prefs.speakReplies}
        onClick={() => onChange((p) => ({ ...p, speakReplies: !p.speakReplies }))}
        className={cn(
          pill,
          prefs.speakReplies
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border bg-card text-muted-foreground hover:bg-muted",
        )}
      >
        {prefs.speakReplies ? (
          <Volume2 className="size-4" aria-hidden />
        ) : (
          <VolumeX className="size-4" aria-hidden />
        )}
        Voice
      </button>
      <button
        type="button"
        aria-pressed={slow}
        onClick={() => onChange((p) => ({ ...p, speed: p.speed === "slow" ? "normal" : "slow" }))}
        className={cn(
          pill,
          slow
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border bg-card text-muted-foreground hover:bg-muted",
        )}
      >
        <Gauge className="size-4" aria-hidden />
        Slow
      </button>
    </div>
  );
}
