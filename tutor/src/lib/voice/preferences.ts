import type { Speed } from "./browser-speech";

// Voice settings, remembered in this browser.
export interface VoicePreferences {
  speakReplies: boolean;
  speed: Speed;
}

const STORAGE_KEY = "shuoshuo.voice-prefs.v1";

export const DEFAULT_VOICE_PREFERENCES: VoicePreferences = {
  speakReplies: true,
  speed: "normal",
};

export function loadVoicePreferences(): VoicePreferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_VOICE_PREFERENCES;
    const data: unknown = JSON.parse(raw);
    if (typeof data !== "object" || data === null) return DEFAULT_VOICE_PREFERENCES;
    const d = data as Record<string, unknown>;
    return {
      speakReplies:
        typeof d.speakReplies === "boolean"
          ? d.speakReplies
          : DEFAULT_VOICE_PREFERENCES.speakReplies,
      speed: d.speed === "slow" ? "slow" : "normal",
    };
  } catch {
    return DEFAULT_VOICE_PREFERENCES;
  }
}

export function saveVoicePreferences(prefs: VoicePreferences) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // Not saved this time; the choice still applies for this page view.
  }
}
