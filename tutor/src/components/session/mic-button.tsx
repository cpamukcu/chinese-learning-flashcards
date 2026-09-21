import { Mic } from "lucide-react";
import { cn } from "@/lib/utils";

export function MicButton({
  listening,
  disabled,
  onClick,
}: {
  listening: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={listening}
      aria-label={listening ? "Stop and send what you said" : "Speak in Chinese"}
      className={cn(
        "relative grid size-14 shrink-0 place-items-center rounded-full text-primary-foreground shadow-md transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none disabled:opacity-50",
        listening ? "bg-destructive" : "bg-primary hover:bg-primary/90",
      )}
    >
      {listening && (
        <span
          aria-hidden
          className="absolute inset-0 animate-ping rounded-full bg-destructive/40 motion-reduce:hidden"
        />
      )}
      {listening ? (
        <span aria-hidden className="relative flex h-6 items-center gap-[3px]">
          {[0, 1, 2, 3, 4].map((i) => (
            <span
              key={i}
              className="voice-bar h-full w-[3px] rounded-full bg-current"
              style={{ animationDelay: `${i * 120}ms` }}
            />
          ))}
        </span>
      ) : (
        <Mic className="relative size-6" aria-hidden />
      )}
    </button>
  );
}
