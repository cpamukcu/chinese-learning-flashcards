import "server-only";
import { runClaudeTurn } from "./anthropic";
import { runOllamaTurn } from "./ollama";
import { runOpenAICompatibleTurn } from "./openai-compatible";
import type { TutorReply, TutorRequest } from "./types";

export type TutorProvider = "ollama" | "anthropic" | "openai-compatible";

// TUTOR_PROVIDER picks the model backend:
//   openai-compatible  Chinese and other chat APIs, reachable inside China
//   anthropic          Claude (paid; not available in mainland China)
//   ollama             free model running on your own machine
// Unset: whichever key is present (Claude, then LLM_API_KEY), else Ollama.
export function getTutorProvider(): TutorProvider {
  const chosen = process.env.TUTOR_PROVIDER?.toLowerCase();
  if (chosen === "ollama" || chosen === "anthropic" || chosen === "openai-compatible") {
    return chosen;
  }
  if (process.env.ANTHROPIC_API_KEY) return "anthropic";
  if (process.env.LLM_API_KEY) return "openai-compatible";
  return "ollama";
}

export function runTutorTurn(request: TutorRequest): Promise<TutorReply> {
  switch (getTutorProvider()) {
    case "ollama":
      return runOllamaTurn(request);
    case "openai-compatible":
      return runOpenAICompatibleTurn(request);
    case "anthropic":
      return runClaudeTurn(request);
  }
}
