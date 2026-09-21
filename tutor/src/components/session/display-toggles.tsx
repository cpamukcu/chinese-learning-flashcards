"use client";

import { cn } from "@/lib/utils";

export interface Display {
  zh: boolean;
  pinyin: boolean;
  en: boolean;
}

const OPTIONS: { key: keyof Display; label: string; lang?: string }[] = [
  { key: "zh", label: "汉字", lang: "zh-CN" },
  { key: "pinyin", label: "Pinyin" },
  { key: "en", label: "English" },
];

// At least one line always stays visible so captions are never all hidden.
export function toggleDisplay(display: Display, key: keyof Display): Display {
  const next = { ...display, [key]: !display[key] };
  return Object.values(next).some(Boolean) ? next : display;
}

export function DisplayToggles({
  display,
  onToggle,
}: {
  display: Display;
  onToggle: (key: keyof Display) => void;
}) {
  const visibleCount = Object.values(display).filter(Boolean).length;

  return (
    <div role="group" aria-label="Show in transcript" className="flex gap-2">
      {OPTIONS.map(({ key, label, lang }) => {
        const on = display[key];
        const isLast = on && visibleCount === 1;
        return (
          <button
            key={key}
            type="button"
            lang={lang}
            aria-pressed={on}
            disabled={isLast}
            onClick={() => onToggle(key)}
            className={cn(
              "min-h-9 rounded-full border px-3.5 text-sm font-medium transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
              lang && "font-zh",
              on
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:bg-muted",
              isLast && "cursor-not-allowed",
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
