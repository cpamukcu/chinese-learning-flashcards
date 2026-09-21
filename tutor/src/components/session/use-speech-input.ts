"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  describeRecognitionError,
  isSpeechInputSupported,
  isSpeechOutputSupported,
  startListening,
  stopSpeaking,
  unlockSpeech,
  type Listener,
} from "@/lib/voice/browser-speech";

const subscribeNever = () => () => {};

// Browser capabilities. False on the server and during hydration, then the real
// answer, so the server-rendered HTML always matches the first client render.
export function useVoiceSupport() {
  const input = useSyncExternalStore(subscribeNever, isSpeechInputSupported, () => false);
  const output = useSyncExternalStore(subscribeNever, isSpeechOutputSupported, () => false);
  const ready = useSyncExternalStore(subscribeNever, () => true, () => false);
  return { input, output, ready };
}

// Tap-to-talk. `onFinal` receives what was heard once the speaker pauses.
export function useSpeechInput(onFinal: (text: string) => void) {
  const { input: supported } = useVoiceSupport();
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<string | null>(null);

  const listenerRef = useRef<Listener | null>(null);
  const onFinalRef = useRef(onFinal);
  useEffect(() => {
    onFinalRef.current = onFinal;
  }, [onFinal]);

  // Leaving the page must release the microphone.
  useEffect(() => () => listenerRef.current?.abort(), []);

  const toggle = useCallback(() => {
    if (listenerRef.current) {
      listenerRef.current.stop(); // finish and deliver what was heard
      return;
    }
    // A tap is the moment browsers allow the mic and (on iPhone) later speech.
    stopSpeaking();
    unlockSpeech();
    setError(null);
    setInterim("");

    const listener = startListening({
      onInterim: setInterim,
      onFinal: (text) => onFinalRef.current(text),
      onError: (code) => setError(describeRecognitionError(code) || null),
      onEnd: () => {
        listenerRef.current = null;
        setListening(false);
        setInterim("");
      },
    });
    if (!listener) {
      setError(describeRecognitionError("start-failed"));
      return;
    }
    listenerRef.current = listener;
    setListening(true);
  }, []);

  return { supported, listening, interim, error, toggle };
}
