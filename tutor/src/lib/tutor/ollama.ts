import { TutorProviderError } from "./errors";
import { runPipelineTurn, type ChatFn } from "./pipeline";
import type { TutorReply, TutorRequest } from "./types";

// Free, local model served by Ollama (https://ollama.com). No API key, no
// account, nothing leaves your machine. Runs on your Mac while `ollama` is open.
export const DEFAULT_OLLAMA_MODEL = "qwen2.5:3b";
const DEFAULT_OLLAMA_URL = "http://localhost:11434";

// The first request after start-up loads the model into memory, which is slow.
const REQUEST_TIMEOUT_MS = 180_000;

// One call to Ollama's chat API; returns the model's text. Throws
// TutorProviderError with an actionable message for the failures a user can fix.
const chatOllama: ChatFn = async (messages, format, { temperature, maxTokens }) => {
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
        options: { temperature, num_predict: maxTokens },
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
};

export function runOllamaTurn(request: TutorRequest): Promise<TutorReply> {
  return runPipelineTurn(request, chatOllama);
}
