// Spec §5. All speech code goes behind this interface so the Option B pipeline
// (STT → Claude → TTS) can later be swapped for a realtime speech-to-speech API.

export interface VoiceProvider {
  transcribe(audio: Blob, lang: "zh-CN"): Promise<string>;
  synthesize(
    text: string,
    opts: { voice: string; rate: number },
  ): Promise<ReadableStream>;
}
