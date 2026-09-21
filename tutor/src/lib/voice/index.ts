import "server-only";
import type { VoiceProvider } from "./types";

export type { VoiceProvider } from "./types";

// Milestone 3 replaces this with the real STT + TTS pipeline provider.
// API routes (/api/stt, /api/tts) must only ever go through this factory.
export function getVoiceProvider(): VoiceProvider {
  throw new Error("No voice provider configured yet — arrives in Milestone 3.");
}
