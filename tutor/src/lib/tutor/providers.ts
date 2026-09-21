// Model providers a visitor can pick in the static edition. All speak the
// OpenAI-compatible chat API and, when checked, allow browser (CORS) calls from
// https://cpamukcu.github.io, and all are reachable inside mainland China.
export interface ProviderPreset {
  id: string;
  label: string;
  baseUrl: string;
  model: string;
  signupUrl: string;
  // Short help shown under the provider picker.
  note?: string;
  // Show the model box so it can be changed (free model lists change often).
  editableModel?: boolean;
  // Minimum max_tokens per request. Models that "think" first spend part of the
  // limit on thinking, which would otherwise leave the answer cut off.
  minMaxTokens?: number;
}

export const CUSTOM_PRESET_ID = "custom";

export const PROVIDER_PRESETS: readonly ProviderPreset[] = [
  {
    id: "openrouter",
    label: "OpenRouter (free models)",
    baseUrl: "https://openrouter.ai/api/v1",
    model: "qwen/qwen3.8-27b:free",
    signupUrl: "https://openrouter.ai/keys",
    note: "Free account, no card. Free models allow about 50 requests a day (roughly 25 chat turns) and the list changes: if this model stops working, pick another ending in :free at openrouter.ai/models.",
    editableModel: true,
    minMaxTokens: 2000,
  },
  {
    id: "zhipu",
    label: "Zhipu GLM-4-Flash (free tier)",
    baseUrl: "https://open.bigmodel.cn/api/paas/v4",
    model: "glm-4-flash",
    signupUrl: "https://open.bigmodel.cn/",
  },
  {
    id: "deepseek",
    label: "DeepSeek (very cheap)",
    baseUrl: "https://api.deepseek.com",
    model: "deepseek-chat",
    signupUrl: "https://platform.deepseek.com/",
  },
  {
    id: "qwen",
    label: "Alibaba Qwen",
    baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    model: "qwen-plus",
    signupUrl: "https://bailian.console.aliyun.com/",
  },
  {
    id: "kimi",
    label: "Moonshot Kimi",
    baseUrl: "https://api.moonshot.cn/v1",
    model: "moonshot-v1-8k",
    signupUrl: "https://platform.moonshot.cn/",
  },
];

export function getPreset(id: string): ProviderPreset | undefined {
  return PROVIDER_PRESETS.find((p) => p.id === id);
}
