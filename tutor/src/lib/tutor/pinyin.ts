import { pinyin } from "pinyin-pro";

const CJK = /[㐀-鿿]/;

export function containsChinese(text: string): boolean {
  return CJK.test(text);
}

// Heavy: pulls in pinyin-pro's dictionary. Browser code should load this module
// with a dynamic import() so it never blocks the initial page.

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
