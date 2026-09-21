"use client";

import { SendHorizontal } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LIMITS } from "@/lib/tutor/config";
import { MicButton } from "./mic-button";

export interface VoiceInput {
  // False until the browser is known to support speech recognition.
  supported: boolean;
  // False until hydration finishes, so the "unsupported" note never flashes.
  ready: boolean;
  listening: boolean;
  interim: string;
  error: string | null;
  onToggle: () => void;
}

export function ChatInput({
  disabled,
  onSend,
  voice,
}: {
  disabled: boolean;
  onSend: (text: string) => void;
  voice?: VoiceInput;
}) {
  const [text, setText] = useState("");

  function submit(event: FormEvent) {
    event.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText("");
  }

  return (
    <div>
      {voice?.error && (
        <p role="alert" className="mb-2 text-sm text-destructive">
          {voice.error}
        </p>
      )}
      <form onSubmit={submit} className="flex items-center gap-2">
        {voice?.supported && (
          <MicButton
            listening={voice.listening}
            disabled={disabled && !voice.listening}
            onClick={voice.onToggle}
          />
        )}
        {voice?.listening ? (
          <div
            role="status"
            aria-live="polite"
            lang="zh-CN"
            className="font-zh flex h-12 min-w-0 flex-1 items-center overflow-hidden rounded-xl border border-destructive/40 bg-card px-4 text-base"
          >
            <span className="truncate">
              {voice.interim || (
                <span className="text-muted-foreground">Listening… speak Chinese, then pause</span>
              )}
            </span>
          </div>
        ) : (
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            lang="zh-CN"
            maxLength={LIMITS.maxMessageChars}
            enterKeyHint="send"
            autoComplete="off"
            autoCapitalize="off"
            aria-label="Your message in Chinese"
            placeholder="Type Chinese or English"
            className="font-zh h-12 min-w-0 flex-1 rounded-xl bg-card px-4 text-base"
          />
        )}
        <Button
          type="submit"
          size="lg"
          disabled={disabled || voice?.listening || !text.trim()}
          aria-label="Send"
          className="shrink-0"
        >
          <SendHorizontal aria-hidden />
        </Button>
      </form>
      {voice?.ready && (
        <p className="mt-1.5 text-xs text-muted-foreground">
          {voice.supported
            ? "Tap the mic and speak; pause to send. Your browser's speech service transcribes it, and this site never receives your audio."
            : "Voice input isn't available in this browser (try Chrome, Edge or Safari). You can type instead."}
        </p>
      )}
    </div>
  );
}
