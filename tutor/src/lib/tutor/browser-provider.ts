import { createOllamaChat } from "./ollama";
import type { ModelSettings } from "./model-settings";
import { createOpenAICompatibleChat } from "./openai-compatible";
import { runPipelineTurn } from "./pipeline";
import type { TutorReply, TutorRequest } from "./types";

// One tutor turn, run entirely in the visitor's browser (static edition).
// Same prompt, correction check and parsing as the server; only the transport
// differs. Load this module with dynamic import(): it pulls in pinyin-pro.
export function runBrowserTurn(
  request: TutorRequest,
  settings: ModelSettings,
): Promise<TutorReply> {
  const chat =
    settings.kind === "ollama"
      ? createOllamaChat({
          baseUrl: settings.ollamaUrl.trim(),
          model: settings.ollamaModel.trim(),
        })
      : createOpenAICompatibleChat({
          baseUrl: settings.baseUrl.trim(),
          model: settings.model.trim(),
          apiKey: settings.apiKey.trim(),
        });
  return runPipelineTurn(request, chat);
}
