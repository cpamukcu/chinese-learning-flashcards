import { LIMITS } from "./config";
import { isHskLevel, isScenarioId } from "./scenarios";
import type { ChatTurn, TutorRequest } from "./types";

export type RequestResult =
  | { ok: true; value: TutorRequest }
  | { ok: false; error: string };

const fail = (error: string): RequestResult => ({ ok: false, error });

// Validates untrusted JSON from the browser. Trims messages and keeps only the
// most recent turns so cost per request stays bounded.
export function parseTutorRequest(body: unknown): RequestResult {
  if (typeof body !== "object" || body === null) {
    return fail("Request body must be a JSON object.");
  }
  const { messages, scenario, level } = body as Record<string, unknown>;

  if (!isScenarioId(scenario)) return fail("Unknown scenario.");
  if (!isHskLevel(level)) return fail("Level must be an integer from 1 to 6.");
  if (!Array.isArray(messages)) return fail("messages must be an array.");
  if (messages.length > LIMITS.maxHistoryTurns * 3) {
    return fail("Conversation is too long.");
  }

  const turns: ChatTurn[] = [];
  for (const item of messages) {
    if (typeof item !== "object" || item === null) {
      return fail("Each message must be an object.");
    }
    const { role, text } = item as Record<string, unknown>;
    if (role !== "user" && role !== "tutor") {
      return fail("Message role must be 'user' or 'tutor'.");
    }
    if (typeof text !== "string") return fail("Message text must be a string.");
    const trimmed = text.trim();
    if (!trimmed) return fail("Messages cannot be empty.");
    if (trimmed.length > LIMITS.maxMessageChars) {
      return fail(`Messages are limited to ${LIMITS.maxMessageChars} characters.`);
    }
    turns.push({ role, text: trimmed });
  }

  // An empty history means "start the session"; otherwise the learner spoke last.
  if (turns.length > 0 && turns[turns.length - 1].role !== "user") {
    return fail("The last message must be from the learner.");
  }

  return {
    ok: true,
    value: {
      messages: turns.slice(-LIMITS.maxHistoryTurns),
      scenario,
      level,
    },
  };
}
