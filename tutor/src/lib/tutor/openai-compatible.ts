import { TutorProviderError } from "./errors";
import { runPipelineTurn, type ChatFn } from "./pipeline";
import type { TutorReply, TutorRequest } from "./types";

// Any "OpenAI-compatible" chat API. This is how the tutor reaches models that
// work inside mainland China, none of which need a VPN: Zhipu GLM, DeepSeek,
// Alibaba Qwen, Moonshot Kimi, and so on. Set three variables:
//   LLM_BASE_URL  e.g. https://open.bigmodel.cn/api/paas/v4
//   LLM_API_KEY   your key from that provider
//   LLM_MODEL     e.g. glm-4-flash
const DEFAULT_BASE_URL = "https://open.bigmodel.cn/api/paas/v4";
const DEFAULT_MODEL = "glm-4-flash";
const REQUEST_TIMEOUT_MS = 60_000;

const chatOpenAICompatible: ChatFn = async (messages, schema, { temperature, maxTokens }) => {
  const apiKey = process.env.LLM_API_KEY;
  if (!apiKey) {
    throw new TutorProviderError(
      "The tutor needs a model API key. Set LLM_API_KEY (and LLM_BASE_URL / LLM_MODEL) in .env.local, then restart the server.",
      "llm_key_missing",
    );
  }
  const baseUrl = (process.env.LLM_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, "");
  const model = process.env.LLM_MODEL || DEFAULT_MODEL;

  // These APIs usually can't enforce a schema, so the schema goes in the prompt
  // and response_format keeps the output to a single JSON object.
  const withSchema = messages.map((m, i) =>
    i === 0 && m.role === "system"
      ? {
          ...m,
          content: `${m.content}\n\nReply with ONLY one JSON object (no markdown, no extra text) that matches this JSON Schema:\n${JSON.stringify(schema)}`,
        }
      : m,
  );

  let response: Response;
  try {
    response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      body: JSON.stringify({
        model,
        messages: withSchema,
        temperature,
        max_tokens: maxTokens,
        stream: false,
        response_format: { type: "json_object" },
      }),
    });
  } catch {
    throw new TutorProviderError(
      "Couldn't reach the model provider. Check LLM_BASE_URL and the server's internet connection.",
      "llm_unreachable",
      502,
    );
  }

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    console.error("[llm]", response.status, detail.slice(0, 500));
    if (response.status === 401 || response.status === 403) {
      throw new TutorProviderError(
        "The model provider rejected the API key. Check LLM_API_KEY.",
        "llm_auth",
      );
    }
    if (response.status === 402 || /insufficient|balance|quota|arrear/i.test(detail)) {
      throw new TutorProviderError(
        "The model account is out of quota or credit. Check your provider's billing page.",
        "llm_no_credit",
        402,
      );
    }
    if (response.status === 429) {
      throw new TutorProviderError(
        "The model provider is busy. Please try again in a moment.",
        "llm_rate_limited",
        429,
      );
    }
    throw new TutorProviderError(
      "The model provider returned an error. Check the server terminal for details.",
      "llm_error",
      502,
    );
  }

  const data: unknown = await response.json().catch(() => null);
  const content = (
    data as { choices?: { message?: { content?: unknown } }[] } | null
  )?.choices?.[0]?.message?.content;
  return typeof content === "string" ? content : "";
};

export function runOpenAICompatibleTurn(request: TutorRequest): Promise<TutorReply> {
  return runPipelineTurn(request, chatOpenAICompatible);
}
