import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { serverEnv } from "@/lib/env.server";
import { TUTOR_MAX_TOKENS, TUTOR_MODEL } from "./config";
import { TutorProviderError, TutorRefusalError } from "./errors";
import { TUTOR_OUTPUT_SCHEMA } from "./output-schema";
import { parseTutorReply } from "./parse";
import { buildApiMessages, buildSystemPrompt } from "./prompt";
import type { TutorReply, TutorRequest } from "./types";

// Created per call so a missing key surfaces as a clear error at request time
// instead of crashing the build.
function getClient() {
  return new Anthropic({ apiKey: serverEnv.anthropicApiKey });
}

export async function runClaudeTurn(request: TutorRequest): Promise<TutorReply> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new TutorProviderError(
      "The tutor needs your Claude API key. Add ANTHROPIC_API_KEY to tutor/.env.local and restart the server. Or use the free local model: set TUTOR_PROVIDER=ollama.",
      "tutor_unavailable",
    );
  }
  const response = await getClient().beta.messages.create({
    model: TUTOR_MODEL,
    max_tokens: TUTOR_MAX_TOKENS,
    system: buildSystemPrompt(request.scenario, request.level),
    messages: buildApiMessages(request.messages),
    // Low effort keeps turns fast and cheap; a reply is 1–3 short sentences.
    output_config: {
      effort: "low",
      format: { type: "json_schema", schema: TUTOR_OUTPUT_SCHEMA },
    },
    // If a safety classifier declines, re-run on Anthropic's recommended
    // fallback model instead of failing the learner's turn.
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
  });

  // Check stop_reason before reading content: a refusal has no usable text.
  if (response.stop_reason === "refusal") throw new TutorRefusalError();

  const text = response.content
    .flatMap((block) => (block.type === "text" ? [block.text] : []))
    .join("");

  return parseTutorReply(text);
}
