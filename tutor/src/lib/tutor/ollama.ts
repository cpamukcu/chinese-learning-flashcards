import { TutorProviderError } from "./errors";
import { TUTOR_OUTPUT_SCHEMA } from "./output-schema";
import { parseTutorReply, TutorParseError } from "./parse";
import { containsChinese, isMostlyChinese } from "./pinyin";
import { buildApiMessages, buildSystemPrompt } from "./prompt";
import type { HskLevel, TutorCorrection, TutorReply, TutorRequest } from "./types";

// Free, local model served by Ollama (https://ollama.com). No API key, no
// account, nothing leaves your machine. Runs on your Mac while `ollama` is open.
export const DEFAULT_OLLAMA_MODEL = "qwen2.5:3b";
const DEFAULT_OLLAMA_URL = "http://localhost:11434";

// The first request after start-up loads the model into memory, which is slow.
const REQUEST_TIMEOUT_MS = 180_000;

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

// One call to Ollama's chat API; returns the model's text. Throws
// TutorProviderError with an actionable message for the failures a user can fix.
async function chat(
  messages: ChatMessage[],
  format: object,
  options: { temperature: number; num_predict: number },
): Promise<string> {
  const baseUrl = process.env.OLLAMA_BASE_URL || DEFAULT_OLLAMA_URL;
  const model = process.env.OLLAMA_MODEL || DEFAULT_OLLAMA_MODEL;

  let response: Response;
  try {
    response = await fetch(`${baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      body: JSON.stringify({
        model,
        stream: false,
        // Keep the model in memory between turns; loading it takes ~1 minute.
        keep_alive: "30m",
        // Constrains the output to a JSON schema (structured outputs).
        format,
        messages,
        options,
      }),
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "TimeoutError") {
      throw new TutorProviderError(
        "The local model took too long to answer. Try again, or use a smaller model.",
        "ollama_timeout",
        504,
      );
    }
    throw new TutorProviderError(
      "Ollama isn't running. Open the Ollama app (or run `ollama serve`), then try again.",
      "ollama_down",
    );
  }

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    if (response.status === 404 && /not found/i.test(detail)) {
      throw new TutorProviderError(
        `The model "${model}" isn't downloaded yet. Run: ollama pull ${model}`,
        "ollama_model_missing",
      );
    }
    console.error("[ollama]", response.status, detail);
    throw new TutorProviderError(
      "The local model returned an error. Check the server terminal for details.",
      "ollama_error",
      502,
    );
  }

  const data: unknown = await response.json().catch(() => null);
  const content =
    typeof data === "object" && data !== null && "message" in data
      ? (data as { message?: { content?: unknown } }).message?.content
      : undefined;
  return typeof content === "string" ? content : "";
}

async function askForReply(request: TutorRequest): Promise<TutorReply> {
  const content = await chat(
    [
      { role: "system", content: buildSystemPrompt(request.scenario, request.level) },
      ...buildApiMessages(request.messages),
    ],
    TUTOR_OUTPUT_SCHEMA,
    { temperature: 0.6, num_predict: 600 },
  );
  return parseTutorReply(content);
}

// ---- Corrections -----------------------------------------------------------
// Small models rarely produce corrections when it is one task among several
// (the 3B model returned none in testing). Checking a single sentence is a job
// they can do, so it gets its own focused call.

const CHECK_SCHEMA = {
  type: "object",
  properties: {
    corrected: { type: "string" },
    explanation: { type: "string" },
  },
  required: ["corrected", "explanation"],
  additionalProperties: false,
} as const;

function checkPrompt(level: HskLevel) {
  return `You are a careful Mandarin teacher checking one sentence written by a learner at HSK ${level}.
Find real mistakes only: wrong word order, wrong word, missing or wrong measure word, wrong or reversed characters, missing 了/的/在 where required.
Ignore punctuation, spaces, and style choices.
Return "corrected": the sentence fixed with the smallest possible change. If the sentence is already correct and natural, return it exactly unchanged and leave "explanation" empty.
"explanation" is one short English sentence (under 20 words) saying what was wrong.
Examples:
我有三个书 -> {"corrected":"我有三本书","explanation":"Books use the measure word 本, not 个."}
他去了昨天学校 -> {"corrected":"他昨天去了学校","explanation":"Time words like 昨天 come before the verb."}
我喜欢喝茶。 -> {"corrected":"我喜欢喝茶。","explanation":""}`;
}

const strip = (s: string) => s.replace(/[\s，。！？、；：,.!?;:"'“”‘’]/g, "");

// Returns a correction, null when the sentence is fine, or undefined when the
// check itself failed (callers then fall back to the main reply's correction).
async function checkSentence(
  text: string,
  level: HskLevel,
): Promise<TutorCorrection | null | undefined> {
  let raw: string;
  try {
    raw = await chat(
      [
        { role: "system", content: checkPrompt(level) },
        { role: "user", content: text },
      ],
      CHECK_SCHEMA,
      { temperature: 0, num_predict: 200 },
    );
  } catch {
    return undefined;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return undefined;
  }
  if (typeof parsed !== "object" || parsed === null) return undefined;
  const { corrected, explanation } = parsed as Record<string, unknown>;
  if (typeof corrected !== "string") return undefined;

  const better = corrected.trim();
  // Unchanged (ignoring punctuation) means nothing to correct.
  if (!better || strip(better) === strip(text)) return null;
  // Reject rambling or non-Chinese "corrections" from a small model.
  if (!containsChinese(better) || /[぀-ヿ]/.test(better)) return null;
  if (strip(better).length > strip(text).length * 2 + 4) return null;

  // A "fix" with no reason attached is usually the model rewording a fine
  // sentence, so it isn't shown.
  const reason = typeof explanation === "string" ? explanation.trim() : "";
  if (!reason) return null;

  return {
    original: text,
    better,
    // Learners need the reason in English; small models sometimes answer in Chinese.
    explanation: isMostlyChinese(reason) ? "A more natural way to say this." : reason,
  };
}

export async function runOllamaTurn(request: TutorRequest): Promise<TutorReply> {
  const last = request.messages[request.messages.length - 1];
  const learnerWroteChinese = last?.role === "user" && containsChinese(last.text);

  // Small local models occasionally produce a bad reply (Japanese, broken
  // JSON). One retry fixes most of these; a second failure is surfaced.
  const reply = async () => {
    try {
      return await askForReply(request);
    } catch (error) {
      if (!(error instanceof TutorParseError)) throw error;
      return askForReply(request);
    }
  };

  const [tutorReply, check] = await Promise.all([
    reply(),
    learnerWroteChinese ? checkSentence(last.text, request.level) : null,
  ]);

  // Not Chinese (or the start of a session): nothing to correct.
  if (!learnerWroteChinese) return { ...tutorReply, correction: null };
  // The focused check wins; if it failed, keep whatever the main reply said.
  return check === undefined ? tutorReply : { ...tutorReply, correction: check };
}
