import "server-only";
import { runClaudeTurn } from "./anthropic";
import { runOllamaTurn } from "./ollama";
import type { TutorReply, TutorRequest } from "./types";

export type TutorProvider = "ollama" | "anthropic";

// TUTOR_PROVIDER picks the model backend. Unset: Claude if a key is present,
// otherwise the free local Ollama model.
export function getTutorProvider(): TutorProvider {
  const chosen = process.env.TUTOR_PROVIDER?.toLowerCase();
  if (chosen === "ollama" || chosen === "anthropic") return chosen;
  return process.env.ANTHROPIC_API_KEY ? "anthropic" : "ollama";
}

export function runTutorTurn(request: TutorRequest): Promise<TutorReply> {
  return getTutorProvider() === "ollama"
    ? runOllamaTurn(request)
    : runClaudeTurn(request);
}
