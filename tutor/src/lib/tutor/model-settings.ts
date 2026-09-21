import { DEFAULT_OLLAMA_MODEL } from "./ollama";
import { CUSTOM_PRESET_ID, PROVIDER_PRESETS, getPreset } from "./providers";

// What a visitor to the static site chooses. Saved only in this browser's
// localStorage and sent only to the provider they picked.
export interface ModelSettings {
  kind: "api" | "ollama";
  presetId: string; // a preset id, or "custom"
  baseUrl: string;
  model: string;
  apiKey: string;
  ollamaUrl: string;
  ollamaModel: string;
}

const STORAGE_KEY = "shuoshuo.model-settings.v1";

export const DEFAULT_MODEL_SETTINGS: ModelSettings = {
  kind: "api",
  presetId: PROVIDER_PRESETS[0].id,
  baseUrl: PROVIDER_PRESETS[0].baseUrl,
  model: PROVIDER_PRESETS[0].model,
  apiKey: "",
  ollamaUrl: "http://localhost:11434",
  ollamaModel: DEFAULT_OLLAMA_MODEL,
};

const str = (value: unknown, fallback: string) =>
  typeof value === "string" ? value : fallback;

// Reads saved settings, ignoring anything malformed. Storage can be unavailable
// (private windows, blocked cookies), so every access is guarded.
export function loadModelSettings(): ModelSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_MODEL_SETTINGS;
    const data: unknown = JSON.parse(raw);
    if (typeof data !== "object" || data === null) return DEFAULT_MODEL_SETTINGS;
    const d = data as Record<string, unknown>;
    const d0 = DEFAULT_MODEL_SETTINGS;
    return {
      kind: d.kind === "ollama" ? "ollama" : "api",
      presetId: str(d.presetId, d0.presetId),
      baseUrl: str(d.baseUrl, d0.baseUrl),
      model: str(d.model, d0.model),
      apiKey: str(d.apiKey, ""),
      ollamaUrl: str(d.ollamaUrl, d0.ollamaUrl),
      ollamaModel: str(d.ollamaModel, d0.ollamaModel),
    };
  } catch {
    return DEFAULT_MODEL_SETTINGS;
  }
}

export function saveModelSettings(settings: ModelSettings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Not saved this time; the settings still work for this page view.
  }
}

// Switching preset fills in that provider's address and model.
export function withPreset(settings: ModelSettings, presetId: string): ModelSettings {
  const preset = getPreset(presetId);
  if (!preset) return { ...settings, presetId: CUSTOM_PRESET_ID };
  return { ...settings, presetId, baseUrl: preset.baseUrl, model: preset.model };
}

function isHttpUrl(value: string) {
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

// Enough to attempt a request (the provider decides if the key is valid).
export function isUsable(settings: ModelSettings): boolean {
  if (settings.kind === "ollama") {
    return isHttpUrl(settings.ollamaUrl) && settings.ollamaModel.trim() !== "";
  }
  return (
    isHttpUrl(settings.baseUrl) &&
    settings.model.trim() !== "" &&
    settings.apiKey.trim() !== ""
  );
}
