import {
  containsChinese,
  isMostlyChinese,
  toPinyin,
  toWordPinyin,
} from "./pinyin";
import type { TutorCorrection, TutorNewWord, TutorReply } from "./types";

export class TutorParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TutorParseError";
  }
}

const MAX_NEW_WORDS = 5;
// Hiragana/katakana: small models sometimes slip into Japanese.
const KANA = /[\u3040-\u30ff]/;

function str(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

// Models occasionally wrap JSON in prose or a ```json fence even when asked
// not to. Take the outermost {...} block.
function extractJsonObject(raw: string): unknown {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end <= start) {
    throw new TutorParseError("Tutor reply contained no JSON object.");
  }
  try {
    return JSON.parse(raw.slice(start, end + 1));
  } catch {
    throw new TutorParseError("Tutor reply was not valid JSON.");
  }
}

function parseCorrection(value: unknown): TutorCorrection | null {
  if (typeof value !== "object" || value === null) return null;
  const c = value as Record<string, unknown>;
  const original = str(c.original);
  const better = str(c.better);
  const explanation = str(c.explanation);
  // A correction that changes nothing is not a correction.
  if (!original || !better || original === better) return null;
  return { original, better, explanation };
}

function parseNewWords(value: unknown): TutorNewWord[] {
  if (!Array.isArray(value)) return [];
  const words: TutorNewWord[] = [];
  for (const item of value) {
    if (typeof item !== "object" || item === null) continue;
    const w = item as Record<string, unknown>;
    const zh = str(w.zh);
    const en = str(w.en);
    if (!zh || !en) continue;
    words.push({ zh, en, pinyin: str(w.pinyin) || toWordPinyin(zh) });
    if (words.length === MAX_NEW_WORDS) break;
  }
  return words;
}

// Validates the model's output into the spec §6 shape. Pinyin is generated
// locally with pinyin-pro unless the model supplied it.
export function parseTutorReply(raw: string): TutorReply {
  const data = extractJsonObject(raw);
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    throw new TutorParseError("Tutor reply was not a JSON object.");
  }
  const obj = data as Record<string, unknown>;

  const reply_zh = str(obj.reply_zh);
  if (!reply_zh) {
    throw new TutorParseError("Tutor reply is missing reply_zh.");
  }
  // reply_zh is what gets spoken; a reply with no Chinese is a model slip.
  if (!containsChinese(reply_zh)) {
    throw new TutorParseError("Tutor reply_zh contains no Chinese.");
  }
  if (KANA.test(reply_zh)) {
    throw new TutorParseError("Tutor reply_zh contains Japanese kana.");
  }

  return {
    reply_zh,
    reply_pinyin: str(obj.reply_pinyin) || toPinyin(reply_zh),
    // A "translation" that is really Chinese (small-model slip) is dropped.
    reply_en: isMostlyChinese(str(obj.reply_en)) ? "" : str(obj.reply_en),
    correction: parseCorrection(obj.correction),
    new_words: parseNewWords(obj.new_words),
  };
}
