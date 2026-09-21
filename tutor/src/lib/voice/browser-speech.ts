// Free voice using the speech built into the browser (Web Speech API). No
// account, no key, and this site never receives or stores any audio.
//
//  - Listening: Chrome/Edge send the audio to Google's speech service, Safari to
//    Apple's. Firefox has no speech recognition. In mainland China Chrome's
//    service is usually unreachable, so typing must always stay available.
//  - Speaking: uses the voices installed on the device, works offline.
//
// Kept apart from the server-side VoiceProvider interface (types.ts), which is
// for recorded-audio providers: the browser recogniser never exposes audio.

// Minimal shapes: lib.dom doesn't cover the webkit-prefixed API consistently.
interface AlternativeLike {
  transcript: string;
}
interface ResultLike {
  isFinal: boolean;
  0: AlternativeLike;
}
interface RecognitionEventLike {
  results: ArrayLike<ResultLike>;
}
interface RecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: RecognitionEventLike) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}
type RecognitionCtor = new () => RecognitionLike;

function getRecognitionCtor(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: RecognitionCtor;
    webkitSpeechRecognition?: RecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function isSpeechInputSupported(): boolean {
  return getRecognitionCtor() !== null;
}

export function isSpeechOutputSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "speechSynthesis" in window &&
    "SpeechSynthesisUtterance" in window
  );
}

// ---- Listening -------------------------------------------------------------

export function describeRecognitionError(code: string): string {
  switch (code) {
    case "not-allowed":
    case "service-not-allowed":
      return "Microphone access is blocked. Allow the microphone for this site in your browser settings, or type instead.";
    case "no-speech":
      return "I didn't hear anything. Tap the mic and try again.";
    case "audio-capture":
      return "No microphone was found. Check that one is connected, or type instead.";
    case "network":
      return "Your browser's speech service couldn't be reached (in mainland China, Chrome's voice input often can't). Please type instead.";
    case "language-not-supported":
      return "This browser can't recognise Chinese speech. Please type instead.";
    case "aborted":
      return ""; // the user cancelled: nothing to report
    default:
      return "Voice input didn't work. Please type instead.";
  }
}

export interface ListenHandlers {
  onInterim: (text: string) => void;
  onFinal: (text: string) => void;
  onError: (code: string) => void;
  onEnd: () => void;
}

export interface Listener {
  // Finish and deliver what was heard so far.
  stop: () => void;
  // Discard everything.
  abort: () => void;
}

// Starts one utterance of Mandarin recognition. Returns null if unsupported.
// Must be called from a tap/click: browsers require a user gesture for the mic.
export function startListening(handlers: ListenHandlers): Listener | null {
  const Ctor = getRecognitionCtor();
  if (!Ctor) return null;

  const recognition = new Ctor();
  recognition.lang = "zh-CN";
  recognition.continuous = false; // stops by itself when the speaker pauses
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;

  let heard = "";
  let failed = false;
  let aborted = false;

  recognition.onresult = (event) => {
    let text = "";
    for (let i = 0; i < event.results.length; i++) text += event.results[i][0].transcript;
    heard = text;
    handlers.onInterim(text);
  };
  recognition.onerror = (event) => {
    if (event.error === "aborted") return;
    failed = true;
    handlers.onError(event.error);
  };
  recognition.onend = () => {
    // Some browsers (Safari) end without marking the last result final, so
    // whatever was heard by the end counts.
    const text = heard.trim();
    if (!failed && !aborted && text) handlers.onFinal(text);
    else if (!failed && !aborted) handlers.onError("no-speech");
    handlers.onEnd();
  };

  try {
    recognition.start();
  } catch {
    // start() throws if a session is already running.
    return null;
  }
  return {
    stop: () => recognition.stop(),
    abort: () => {
      aborted = true;
      recognition.abort();
    },
  };
}

// ---- Speaking --------------------------------------------------------------

export interface VoiceLike {
  lang: string;
  name: string;
  localService?: boolean;
}

// Best installed Mandarin voice: mainland Mandarin over other Chinese, and
// higher-quality neural/Google/known-good voices over robotic defaults.
export function pickChineseVoice<T extends VoiceLike>(voices: readonly T[]): T | null {
  let best: T | null = null;
  let bestScore = 0;
  for (const voice of voices) {
    const lang = voice.lang.replace("_", "-").toLowerCase();
    if (!lang.startsWith("zh")) continue;
    let score = 1;
    if (lang === "zh-cn" || lang === "zh-hans-cn" || lang === "zh") score += 10;
    else if (lang === "zh-tw" || lang === "zh-hk" || lang.startsWith("zh-hant")) score -= 3;
    if (/google|natural|neural|xiaoxiao|yunxi|huihui|ting-?ting|meijia|lili/i.test(voice.name)) score += 3;
    if (voice.localService) score += 1;
    if (score > bestScore) {
      best = voice;
      bestScore = score;
    }
  }
  return best;
}

export type Speed = "normal" | "slow";
export const SPEECH_RATES: Record<Speed, number> = { normal: 0.9, slow: 0.65 };

let unlocked = false;

// iOS Safari only lets a page speak after speech has been started once from a
// tap. Call this inside a click handler; later speech (which happens after a
// network wait) is then allowed.
export function unlockSpeech() {
  if (unlocked || !isSpeechOutputSupported()) return;
  unlocked = true;
  const silent = new SpeechSynthesisUtterance("");
  silent.volume = 0;
  window.speechSynthesis.speak(silent);
}

export function stopSpeaking() {
  if (isSpeechOutputSupported()) window.speechSynthesis.cancel();
}

// Speaks Chinese text aloud. Returns false if this browser can't speak.
export function speak(text: string, speed: Speed = "normal"): boolean {
  if (!isSpeechOutputSupported() || !text.trim()) return false;
  const synth = window.speechSynthesis;
  synth.cancel(); // never overlap two replies
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "zh-CN";
  utterance.rate = SPEECH_RATES[speed];
  const voice = pickChineseVoice(synth.getVoices());
  if (voice) utterance.voice = voice as SpeechSynthesisVoice;
  synth.speak(utterance);
  return true;
}
