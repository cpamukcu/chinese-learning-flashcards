// Model providers a visitor can pick in the static edition. All speak the
// OpenAI-compatible chat API and, when checked, allow browser (CORS) calls from
// https://cpamukcu.github.io, and all are reachable inside mainland China.
export interface ProviderPreset {
  id: string;
  label: string;
  baseUrl: string;
  model: string;
  signupUrl: string;
}

export const CUSTOM_PRESET_ID = "custom";

export const PROVIDER_PRESETS: readonly ProviderPreset[] = [
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
