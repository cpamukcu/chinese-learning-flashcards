import { Volume2 } from "lucide-react";
import type { TutorReply } from "@/lib/tutor/types";
import type { Display } from "./display-toggles";

export function TutorMessage({
  reply,
  display,
  onSpeak,
}: {
  reply: TutorReply;
  display: Display;
  // Present when this browser can speak: plays the reply again.
  onSpeak?: () => void;
}) {
  return (
    <div className="max-w-[90%] space-y-2 sm:max-w-[80%]">
      <div className="relative rounded-2xl rounded-tl-md bg-card px-4 py-3 shadow-sm ring-1 ring-border">
        {onSpeak && (
          <button
            type="button"
            onClick={onSpeak}
            aria-label="Play this reply aloud"
            className="absolute top-2 right-2 grid size-9 place-items-center rounded-full text-primary transition-colors hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            <Volume2 className="size-5" aria-hidden />
          </button>
        )}
        {display.zh && (
          <p lang="zh-CN" className={`font-zh text-xl leading-snug sm:text-2xl ${onSpeak ? "pr-9" : ""}`}>
            {reply.reply_zh}
          </p>
        )}
        {display.pinyin && (
          <p className="mt-1 text-sm text-primary sm:text-base">
            {reply.reply_pinyin}
          </p>
        )}
        {display.en && reply.reply_en && (
          <p className="mt-1 text-sm text-muted-foreground sm:text-base">
            {reply.reply_en}
          </p>
        )}
      </div>

      {reply.new_words.length > 0 && (
        <ul aria-label="New words" className="flex flex-wrap gap-1.5 pl-1">
          {reply.new_words.map((word) => (
            <li
              key={word.zh}
              className="rounded-full bg-secondary px-2.5 py-1 text-xs text-secondary-foreground"
            >
              <span lang="zh-CN" className="font-zh font-medium">
                {word.zh}
              </span>{" "}
              <span className="text-primary">{word.pinyin}</span> · {word.en}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
