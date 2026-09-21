import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_MODEL_SETTINGS,
  isUsable,
  loadModelSettings,
  saveModelSettings,
  withPreset,
} from "./model-settings";

// Minimal in-memory localStorage (vitest runs in Node).
function stubStorage(initial: Record<string, string> = {}) {
  const data = { ...initial };
  vi.stubGlobal("localStorage", {
    getItem: (k: string) => (k in data ? data[k] : null),
    setItem: (k: string, v: string) => void (data[k] = v),
  });
  return data;
}

beforeEach(() => stubStorage());
afterEach(() => vi.unstubAllGlobals());

describe("model settings storage", () => {
  it("returns defaults when nothing is saved", () => {
    expect(loadModelSettings()).toEqual(DEFAULT_MODEL_SETTINGS);
  });

  it("round-trips saved settings", () => {
    const settings = { ...DEFAULT_MODEL_SETTINGS, apiKey: "abc", kind: "ollama" as const };
    saveModelSettings(settings);
    expect(loadModelSettings()).toEqual(settings);
  });

  it("ignores corrupt or wrongly typed data", () => {
    stubStorage({ "shuoshuo.model-settings.v1": "{not json" });
    expect(loadModelSettings()).toEqual(DEFAULT_MODEL_SETTINGS);
    stubStorage({ "shuoshuo.model-settings.v1": JSON.stringify({ apiKey: 5, kind: "weird", model: null }) });
    const loaded = loadModelSettings();
    expect(loaded.kind).toBe("api");
    expect(loaded.apiKey).toBe("");
    expect(loaded.model).toBe(DEFAULT_MODEL_SETTINGS.model);
  });

  it("survives storage that throws (private windows)", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
    });
    expect(loadModelSettings()).toEqual(DEFAULT_MODEL_SETTINGS);
    expect(() => saveModelSettings(DEFAULT_MODEL_SETTINGS)).not.toThrow();
  });
});

describe("withPreset", () => {
  it("fills in the provider's address and model but keeps the key", () => {
    const next = withPreset({ ...DEFAULT_MODEL_SETTINGS, apiKey: "secret" }, "deepseek");
    expect(next.baseUrl).toBe("https://api.deepseek.com");
    expect(next.model).toBe("deepseek-chat");
    expect(next.apiKey).toBe("secret");
  });

  it("switching to custom keeps whatever is typed", () => {
    const next = withPreset({ ...DEFAULT_MODEL_SETTINGS, baseUrl: "https://x.example/v1" }, "custom");
    expect(next.presetId).toBe("custom");
    expect(next.baseUrl).toBe("https://x.example/v1");
  });
});

describe("isUsable", () => {
  const withKey = { ...DEFAULT_MODEL_SETTINGS, apiKey: "k" };

  it("needs a key for API mode", () => {
    expect(isUsable(DEFAULT_MODEL_SETTINGS)).toBe(false);
    expect(isUsable(withKey)).toBe(true);
    expect(isUsable({ ...withKey, apiKey: "   " })).toBe(false);
  });

  it("rejects bad addresses and empty models", () => {
    expect(isUsable({ ...withKey, baseUrl: "not a url" })).toBe(false);
    expect(isUsable({ ...withKey, baseUrl: "ftp://x.example" })).toBe(false);
    expect(isUsable({ ...withKey, model: "" })).toBe(false);
  });

  it("Ollama mode needs no key", () => {
    expect(isUsable({ ...DEFAULT_MODEL_SETTINGS, kind: "ollama" })).toBe(true);
    expect(isUsable({ ...DEFAULT_MODEL_SETTINGS, kind: "ollama", ollamaUrl: "nope" })).toBe(false);
  });
});
