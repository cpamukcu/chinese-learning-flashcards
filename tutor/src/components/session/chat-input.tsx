"use client";

import { SendHorizontal } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LIMITS } from "@/lib/tutor/config";

export function ChatInput({
  disabled,
  onSend,
}: {
  disabled: boolean;
  onSend: (text: string) => void;
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
    <form onSubmit={submit} className="flex gap-2">
      <Input
        value={text}
        onChange={(e) => setText(e.target.value)}
        lang="zh-CN"
        maxLength={LIMITS.maxMessageChars}
        enterKeyHint="send"
        autoComplete="off"
        autoCapitalize="off"
        aria-label="Your message in Chinese"
        placeholder="Type in Chinese (or English if you're stuck)"
        className="font-zh h-12 flex-1 rounded-xl bg-card px-4 text-base"
      />
      <Button
        type="submit"
        size="lg"
        disabled={disabled || !text.trim()}
        aria-label="Send"
        className="shrink-0"
      >
        <SendHorizontal aria-hidden />
      </Button>
    </form>
  );
}
