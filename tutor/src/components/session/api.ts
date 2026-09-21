import { IS_STATIC } from "@/lib/static-mode";
import { TutorProviderError } from "@/lib/tutor/errors";
import { loadModelSettings } from "@/lib/tutor/model-settings";
import { parseTutorRequest } from "@/lib/tutor/request";
import type {
  ChatTurn,
  HskLevel,
  ScenarioId,
  TutorCorrection,
  TutorReply,
} from "@/lib/tutor/types";

export interface UserMessage {
  id: string;
  role: "user";
  text: string;
  pinyin: string;
  // undefined = waiting for feedback; null = nothing to correct.
  correction?: TutorCorrection | null;
}

export interface TutorMessage {
  id: string;
  role: "tutor";
  reply: TutorReply;
}

export type ChatMessage = UserMessage | TutorMessage;

export function toTurns(messages: ChatMessage[]): ChatTurn[] {
  return messages.map((m) =>
    m.role === "user"
      ? { role: "user", text: m.text }
      : { role: "tutor", text: m.reply.reply_zh },
  );
}

export class TutorRequestError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
  }
}

// Static edition (GitHub Pages): no server, so the turn runs right here in the
// browser against the provider the visitor configured. The heavy pinyin and
// tutor code is loaded on demand.
async function runInBrowser(
  turns: ChatTurn[],
  scenario: ScenarioId,
  level: HskLevel,
): Promise<TutorReply> {
  const parsed = parseTutorRequest({ messages: turns, scenario, level });
  if (!parsed.ok) throw new TutorRequestError(parsed.error, 400);

  try {
    const [{ runBrowserTurn }, { TutorParseError }] = await Promise.all([
      import("@/lib/tutor/browser-provider"),
      import("@/lib/tutor/parse"),
    ]);
    try {
      return await runBrowserTurn(parsed.value, loadModelSettings());
    } catch (error) {
      if (error instanceof TutorParseError) {
        throw new TutorRequestError("The tutor's reply was garbled. Please try again.", 502);
      }
      throw error;
    }
  } catch (error) {
    if (error instanceof TutorRequestError) throw error;
    if (error instanceof TutorProviderError) {
      throw new TutorRequestError(error.message, error.status);
    }
    throw new TutorRequestError("Something went wrong. Please try again.", 500);
  }
}

export async function fetchTutorReply(
  turns: ChatTurn[],
  scenario: ScenarioId,
  level: HskLevel,
  signal?: AbortSignal,
): Promise<TutorReply> {
  if (IS_STATIC) {
    const reply = await runInBrowser(turns, scenario, level);
    signal?.throwIfAborted();
    return reply;
  }

  let response: Response;
  try {
    response = await fetch("/api/tutor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: turns, scenario, level }),
      signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new TutorRequestError(
      "Couldn't reach the server. Check your connection and try again.",
    );
  }

  const data: unknown = await response.json().catch(() => null);

  if (response.status === 401) {
    throw new TutorRequestError("Your session expired. Please log in again.", 401);
  }
  if (!response.ok) {
    const message =
      typeof data === "object" && data !== null && "message" in data
        ? String((data as { message: unknown }).message)
        : "Something went wrong. Please try again.";
    throw new TutorRequestError(message, response.status);
  }
  if (typeof data !== "object" || data === null || !("reply" in data)) {
    throw new TutorRequestError("The server sent an unexpected response.");
  }
  return (data as { reply: TutorReply }).reply;
}
