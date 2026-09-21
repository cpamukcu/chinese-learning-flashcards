import { containsChinese } from "@/lib/tutor/pinyin";
import { CorrectionCard, NoCorrection } from "./correction-card";
import type { UserMessage as UserMessageData } from "./api";
import type { Display } from "./display-toggles";

export function UserMessage({
  message,
  display,
}: {
  message: UserMessageData;
  display: Display;
}) {
  const hasChinese = containsChinese(message.text);
  // Never leave the learner's own message blank: if every line that applies is
  // toggled off, fall back to showing the text as typed.
  const showText = display.zh || !hasChinese || !(display.pinyin && message.pinyin);

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="max-w-[90%] rounded-2xl rounded-tr-md bg-primary px-4 py-3 text-primary-foreground sm:max-w-[80%]">
        {showText && (
          <p lang={hasChinese ? "zh-CN" : "en"} className={hasChinese ? "font-zh text-xl leading-snug sm:text-2xl" : "text-base"}>
            {message.text}
          </p>
        )}
        {display.pinyin && message.pinyin && (
          <p className="mt-1 text-sm text-primary-foreground/85">{message.pinyin}</p>
        )}
      </div>
      {message.correction && <CorrectionCard correction={message.correction} />}
      {message.correction === null && hasChinese && <NoCorrection />}
    </div>
  );
}
