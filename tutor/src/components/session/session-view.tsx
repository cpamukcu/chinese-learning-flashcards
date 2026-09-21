"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { IS_STATIC } from "@/lib/static-mode";
import {
  DEFAULT_MODEL_SETTINGS,
  isUsable,
  loadModelSettings,
  saveModelSettings,
  type ModelSettings as Settings,
} from "@/lib/tutor/model-settings";
import { getScenario } from "@/lib/tutor/scenarios";
import type { HskLevel, ScenarioId } from "@/lib/tutor/types";
import {
  fetchTutorReply,
  toTurns,
  TutorRequestError,
  type ChatMessage,
  type UserMessage as UserMessageData,
} from "./api";
import { ChatInput } from "./chat-input";
import { ModelSettings } from "./model-settings";
import { DisplayToggles, toggleDisplay, type Display } from "./display-toggles";
import { SetupCard } from "./setup-card";
import { TutorMessage } from "./tutor-message";
import { UserMessage } from "./user-message";

interface Config {
  scenario: ScenarioId;
  level: HskLevel;
}

let nextId = 0;
const newId = () => `m${++nextId}`;

export function SessionView() {
  const router = useRouter();
  const [config, setConfig] = useState<Config | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [display, setDisplay] = useState<Display>({ zh: true, pinyin: true, en: true });

  // Static edition only: which model answers (saved in this browser).
  const [settings, setSettings] = useState<Settings>(DEFAULT_MODEL_SETTINGS);
  useEffect(() => {
    // localStorage only exists in the browser, so it is read after hydration
    // (reading it during render would not match the pre-rendered HTML).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (IS_STATIC) setSettings(loadModelSettings());
  }, []);
  function updateSettings(next: Settings) {
    setSettings(next);
    saveModelSettings(next);
  }

  const abortRef = useRef<AbortController | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading, error]);

  // Ask the tutor for its next turn. `history` ends with the learner's latest
  // message (or is empty at the start of the session).
  const requestReply = useCallback(
    async (history: ChatMessage[], cfg: Config) => {
      const controller = new AbortController();
      abortRef.current = controller;
      setLoading(true);
      setError(null);

      try {
        const reply = await fetchTutorReply(
          toTurns(history),
          cfg.scenario,
          cfg.level,
          controller.signal,
        );
        const last = history[history.length - 1];
        setMessages((prev) => [
          // The correction in this reply is about the learner's last message.
          ...prev.map((m) =>
            last && m.id === last.id && m.role === "user"
              ? { ...m, correction: reply.correction }
              : m,
          ),
          { id: newId(), role: "tutor", reply },
        ]);
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return;
        if (e instanceof TutorRequestError && e.status === 401) {
          router.push("/login");
          return;
        }
        setError(e instanceof Error ? e.message : "Something went wrong.");
      } finally {
        if (abortRef.current === controller) setLoading(false);
      }
    },
    [router],
  );

  function start(scenario: ScenarioId, level: HskLevel) {
    const cfg = { scenario, level };
    // Start fetching the pinyin dictionary (~140 KB) in the background while the
    // tutor's first reply loads; it must not block the page itself.
    void import("@/lib/tutor/pinyin");
    setConfig(cfg);
    setMessages([]);
    void requestReply([], cfg);
  }

  function send(text: string) {
    if (!config || loading) return;
    const userMessage: UserMessageData = {
      id: newId(),
      role: "user",
      text,
      pinyin: "",
    };
    const history = [...messages, userMessage];
    setMessages(history);
    void requestReply(history, config);

    // Fill in the learner's own pinyin as soon as the dictionary is ready.
    void import("@/lib/tutor/pinyin").then(({ toPinyin }) => {
      const pinyin = toPinyin(text);
      setMessages((prev) =>
        prev.map((m) => (m.id === userMessage.id && m.role === "user" ? { ...m, pinyin } : m)),
      );
    });
  }

  function retry() {
    if (config) void requestReply(messages, config);
  }

  function endSession() {
    const hasConversation = messages.length > 1;
    if (
      hasConversation &&
      !window.confirm("End this session? Conversations aren't saved yet.")
    ) {
      return;
    }
    abortRef.current?.abort();
    router.push("/dashboard");
  }

  if (!config) {
    return (
      <div className="min-h-dvh">
        <header className="border-b border-border/60">
          <div className="mx-auto flex h-16 max-w-2xl items-center justify-between px-4">
            <Logo />
            <Button variant="ghost" onClick={() => router.push("/dashboard")}>
              Back
            </Button>
          </div>
        </header>
        <SetupCard
          onStart={start}
          canStart={!IS_STATIC || isUsable(settings)}
          extra={
            IS_STATIC ? (
              <ModelSettings value={settings} onChange={updateSettings} />
            ) : null
          }
        />
      </div>
    );
  }

  const scenario = getScenario(config.scenario);

  return (
    <div className="flex h-dvh flex-col">
      <header className="shrink-0 border-b border-border/60 bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-2.5">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">
              <span lang="zh-CN" className="font-zh">
                {scenario.labelZh}
              </span>{" "}
              · {scenario.label}
            </p>
            <p className="text-xs text-muted-foreground">HSK {config.level}</p>
          </div>
          <Button variant="outline" size="sm" onClick={endSession}>
            End session
          </Button>
        </div>
        <div className="mx-auto max-w-2xl px-4 pb-2.5">
          <DisplayToggles
            display={display}
            onToggle={(key) => setDisplay((d) => toggleDisplay(d, key))}
          />
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div
          role="log"
          aria-live="polite"
          aria-label="Conversation"
          className="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-5"
        >
          {messages.map((m) =>
            m.role === "tutor" ? (
              <TutorMessage key={m.id} reply={m.reply} display={display} />
            ) : (
              <UserMessage key={m.id} message={m} display={display} />
            ),
          )}

          {loading && (
            <div
              role="status"
              aria-label="Tutor is typing"
              className="flex w-16 justify-center gap-1 rounded-2xl rounded-tl-md bg-card px-4 py-3.5 ring-1 ring-border"
            >
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="size-2 animate-bounce rounded-full bg-muted-foreground/50"
                  style={{ animationDelay: `${i * 150}ms` }}
                />
              ))}
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="flex flex-col items-start gap-2 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
            >
              <p>{error}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={retry}>
                  Try again
                </Button>
                {IS_STATIC && (
                  <Button variant="outline" size="sm" onClick={() => setConfig(null)}>
                    Change model settings
                  </Button>
                )}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      <footer className="shrink-0 border-t border-border/60 bg-background pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto max-w-2xl px-4 pt-3">
          <ChatInput disabled={loading} onSend={send} />
        </div>
      </footer>
    </div>
  );
}
