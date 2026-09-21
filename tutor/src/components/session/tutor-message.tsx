import type { TutorReply } from "@/lib/tutor/types";
import type { Display } from "./display-toggles";

export function TutorMessage({
  reply,
  display,
}: {
  reply: TutorReply;
  display: Display;
}) {
  return (
    <div className="max-w-[90%] space-y-2 sm:max-w-[80%]">
      <div className="rounded-2xl rounded-tl-md bg-card px-4 py-3 shadow-sm ring-1 ring-border">
        {display.zh && (
          <p lang="zh-CN" className="font-zh text-xl leading-snug sm:text-2xl">
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
