import { pinyin } from "pinyin-pro";

const CJK = /[㐀-鿿]/;

export function containsChinese(text: string): boolean {
  return CJK.test(text);
}

// Explanations and translations quote Chinese words ("米饭 is one word"), so
// text only counts as "not English" when Chinese characters outnumber Latin letters.
export function isMostlyChinese(text: string): boolean {
  const han = (text.match(/[\u3400-\u9fff]/g) ?? []).length;
  const latin = (text.match(/[A-Za-z]/g) ?? []).length;
  return han > latin;
}

// Word-level pinyin without spaces, for vocabulary chips: "米饭" → "mǐfàn"
export function toWordPinyin(text: string): string {
  return pinyin(text, { toneType: "symbol", type: "array" }).join("");
}

const PUNCTUATION: Record<string, string> = {
  "，": ",",
  "。": ".",
  "！": "!",
  "？": "?",
  "、": ",",
  "；": ";",
  "：": ":",
  "（": "(",
  "）": ")",
  "“": '"',
  "”": '"',
};

// Tone-marked pinyin for a sentence, one syllable at a time: "你好！" → "Nǐ hǎo!"
// Syllable spacing is always correct; grouping into words would need a
// segmenter, and those get it wrong often enough to mislead learners.
// Runs offline in both server and browser.
export function toPinyin(text: string): string {
  if (!containsChinese(text)) return "";

  const raw = pinyin(text, { toneType: "symbol", nonZh: "consecutive" });
  const tidy = [...raw]
    .map((c) => PUNCTUATION[c] ?? c)
    .join("")
    .replace(/\s+([,.!?;:)"])/g, "$1")
    .replace(/(["(])\s+/g, "$1")
    .replace(/\s+/g, " ")
    .trim();

  // Capitalise the first letter of each sentence.
  return tidy
    .replace(/^(\S)/, (c) => c.toUpperCase())
    .replace(/([.!?]\s+)(\S)/g, (_, p: string, c: string) => p + c.toUpperCase());
}
