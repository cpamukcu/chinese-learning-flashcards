import { afterEach, describe, expect, it, vi } from "vitest";
import {
  SPEECH_RATES,
  describeRecognitionError,
  pickChineseVoice,
  speak,
  startListening,
} from "./browser-speech";
import {
  DEFAULT_VOICE_PREFERENCES,
  loadVoicePreferences,
  saveVoicePreferences,
} from "./preferences";

afterEach(() => vi.unstubAllGlobals());

describe("pickChineseVoice", () => {
  it("prefers mainland Mandarin over other Chinese and other languages", () => {
    const voices = [
      { lang: "en-US", name: "Alex" },
      { lang: "zh-TW", name: "Meijia" },
      { lang: "zh-CN", name: "Tingting" },
      { lang: "zh-HK", name: "Sinji" },
    ];
    expect(pickChineseVoice(voices)?.name).toBe("Tingting");
  });

  it("handles underscore language tags and prefers better voices", () => {
    const voices = [
      { lang: "zh_CN", name: "Robot" },
      { lang: "zh_CN", name: "Google 普通话（中国大陆）" },
    ];
    expect(pickChineseVoice(voices)?.name).toContain("Google");
  });

  it("falls back to other Chinese, and returns null when there is none", () => {
    expect(pickChineseVoice([{ lang: "zh-TW", name: "Meijia" }])?.name).toBe("Meijia");
    expect(pickChineseVoice([{ lang: "en-US", name: "Alex" }])).toBeNull();
    expect(pickChineseVoice([])).toBeNull();
  });
});

describe("describeRecognitionError", () => {
  it("gives actionable messages", () => {
    expect(describeRecognitionError("not-allowed")).toMatch(/blocked/i);
    expect(describeRecognitionError("no-speech")).toMatch(/didn't hear/i);
    expect(describeRecognitionError("network")).toMatch(/China/);
    expect(describeRecognitionError("audio-capture")).toMatch(/No microphone/);
    expect(describeRecognitionError("something-new")).toMatch(/type instead/i);
  });

  it("says nothing when the user cancelled", () => {
    expect(describeRecognitionError("aborted")).toBe("");
  });
});

// A controllable fake of the browser's recogniser.
function fakeRecognition() {
  const instances: FakeRecognition[] = [];
  class FakeRecognition {
    lang = "";
    continuous = true;
    interimResults = false;
    maxAlternatives = 0;
    onresult: ((e: { results: { isFinal: boolean; 0: { transcript: string } }[] }) => void) | null = null;
    onerror: ((e: { error: string }) => void) | null = null;
    onend: (() => void) | null = null;
    started = false;
    aborted = false;
    constructor() {
      instances.push(this);
    }
    start() {
      this.started = true;
    }
    stop() {
      this.onend?.();
    }
    abort() {
      this.aborted = true;
      this.onend?.();
    }
    say(...parts: [string, boolean][]) {
      this.onresult?.({
        results: parts.map(([transcript, isFinal]) => ({ isFinal, 0: { transcript } })),
      });
    }
  }
  vi.stubGlobal("window", { webkitSpeechRecognition: FakeRecognition });
  return instances;
}

function handlers() {
  return {
    onInterim: vi.fn(),
    onFinal: vi.fn(),
    onError: vi.fn(),
    onEnd: vi.fn(),
  };
}

describe("startListening", () => {
  it("returns null when the browser has no speech recognition", () => {
    vi.stubGlobal("window", {});
    expect(startListening(handlers())).toBeNull();
  });

  it("configures Mandarin, single utterance, live results", () => {
    const instances = fakeRecognition();
    startListening(handlers());
    expect(instances[0].lang).toBe("zh-CN");
    expect(instances[0].continuous).toBe(false);
    expect(instances[0].interimResults).toBe(true);
    expect(instances[0].started).toBe(true);
  });

  it("streams interim text and delivers the final transcript once", () => {
    const instances = fakeRecognition();
    const h = handlers();
    startListening(h);
    instances[0].say(["我想", false]);
    instances[0].say(["我想吃", false]);
    instances[0].say(["我想吃米饭", true]);
    instances[0].onend?.();
    expect(h.onInterim).toHaveBeenLastCalledWith("我想吃米饭");
    expect(h.onFinal).toHaveBeenCalledTimes(1);
    expect(h.onFinal).toHaveBeenCalledWith("我想吃米饭");
    expect(h.onEnd).toHaveBeenCalledTimes(1);
  });

  it("uses the last interim text when the browser never marks it final (Safari)", () => {
    const instances = fakeRecognition();
    const h = handlers();
    startListening(h);
    instances[0].say(["你好", false]);
    instances[0].onend?.();
    expect(h.onFinal).toHaveBeenCalledWith("你好");
  });

  it("reports an error and never delivers text after one", () => {
    const instances = fakeRecognition();
    const h = handlers();
    startListening(h);
    instances[0].say(["你好", false]);
    instances[0].onerror?.({ error: "network" });
    instances[0].onend?.();
    expect(h.onError).toHaveBeenCalledWith("network");
    expect(h.onFinal).not.toHaveBeenCalled();
    expect(h.onEnd).toHaveBeenCalled();
  });

  it("treats silence as a 'no-speech' problem, not an empty message", () => {
    const instances = fakeRecognition();
    const h = handlers();
    startListening(h);
    instances[0].onend?.();
    expect(h.onFinal).not.toHaveBeenCalled();
    expect(h.onError).toHaveBeenCalledWith("no-speech");
  });

  it("abort() discards what was heard", () => {
    const instances = fakeRecognition();
    const h = handlers();
    const listener = startListening(h);
    instances[0].say(["你好", false]);
    listener?.abort();
    expect(instances[0].aborted).toBe(true);
    expect(h.onFinal).not.toHaveBeenCalled();
    expect(h.onError).not.toHaveBeenCalled();
    expect(h.onEnd).toHaveBeenCalled();
  });

  it("returns null if the browser refuses to start", () => {
    class Refuses {
      start() {
        throw new Error("already started");
      }
    }
    vi.stubGlobal("window", { SpeechRecognition: Refuses });
    expect(startListening(handlers())).toBeNull();
  });
});

describe("speak", () => {
  function fakeSynth(voices: { lang: string; name: string }[] = []) {
    const spoken: { text: string; lang: string; rate: number; voice?: unknown }[] = [];
    const synth = {
      cancel: vi.fn(),
      getVoices: () => voices,
      speak: (u: { text: string; lang: string; rate: number; voice?: unknown }) => spoken.push(u),
    };
    class Utterance {
      voice: unknown;
      lang = "";
      rate = 1;
      constructor(public text: string) {}
    }
    vi.stubGlobal("window", { speechSynthesis: synth, SpeechSynthesisUtterance: Utterance });
    vi.stubGlobal("SpeechSynthesisUtterance", Utterance);
    return { synth, spoken };
  }

  it("speaks Mandarin at the chosen speed, cancelling any earlier speech", () => {
    const { synth, spoken } = fakeSynth([{ lang: "zh-CN", name: "Tingting" }]);
    expect(speak("你好！", "slow")).toBe(true);
    expect(synth.cancel).toHaveBeenCalled();
    expect(spoken[0]).toMatchObject({ text: "你好！", lang: "zh-CN", rate: SPEECH_RATES.slow });
    expect(spoken[0].voice).toMatchObject({ name: "Tingting" });
  });

  it("still speaks (device default voice) when no Chinese voice is listed yet", () => {
    const { spoken } = fakeSynth([]);
    expect(speak("你好")).toBe(true);
    expect(spoken[0].voice).toBeUndefined();
    expect(spoken[0].rate).toBe(SPEECH_RATES.normal);
  });

  it("does nothing for empty text or when unsupported", () => {
    fakeSynth();
    expect(speak("   ")).toBe(false);
    vi.stubGlobal("window", {});
    expect(speak("你好")).toBe(false);
  });
});

describe("voice preferences", () => {
  function stubStorage(initial: Record<string, string> = {}) {
    const data = { ...initial };
    vi.stubGlobal("localStorage", {
      getItem: (k: string) => (k in data ? data[k] : null),
      setItem: (k: string, v: string) => void (data[k] = v),
    });
  }

  it("defaults, round-trips, and ignores garbage", () => {
    stubStorage();
    expect(loadVoicePreferences()).toEqual(DEFAULT_VOICE_PREFERENCES);
    saveVoicePreferences({ speakReplies: false, speed: "slow" });
    expect(loadVoicePreferences()).toEqual({ speakReplies: false, speed: "slow" });
    stubStorage({ "shuoshuo.voice-prefs.v1": "{oops" });
    expect(loadVoicePreferences()).toEqual(DEFAULT_VOICE_PREFERENCES);
    stubStorage({ "shuoshuo.voice-prefs.v1": JSON.stringify({ speakReplies: "yes", speed: 5 }) });
    expect(loadVoicePreferences()).toEqual(DEFAULT_VOICE_PREFERENCES);
  });

  it("survives storage that throws", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
    });
    expect(loadVoicePreferences()).toEqual(DEFAULT_VOICE_PREFERENCES);
    expect(() => saveVoicePreferences(DEFAULT_VOICE_PREFERENCES)).not.toThrow();
  });
});
