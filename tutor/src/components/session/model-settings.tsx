"use client";

import { ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  withPreset,
  type ModelSettings as Settings,
} from "@/lib/tutor/model-settings";
import {
  CUSTOM_PRESET_ID,
  PROVIDER_PRESETS,
  getPreset,
} from "@/lib/tutor/providers";
import { cn } from "@/lib/utils";

// Static edition only: where the tutor's answers come from. There is no server,
// so each visitor brings their own model access.
export function ModelSettings({
  value,
  onChange,
}: {
  value: Settings;
  onChange: (next: Settings) => void;
}) {
  const preset = getPreset(value.presetId);
  const isCustom = value.presetId === CUSTOM_PRESET_ID;

  return (
    <section aria-labelledby="model-heading" className="space-y-3">
      <h2 id="model-heading" className="font-semibold">
        Tutor model
      </h2>
      <p className="text-sm text-muted-foreground">
        This site has no server, so the tutor uses <strong>your own</strong> model access.
        Your key stays in this browser and is sent only to the provider you pick.
      </p>

      <div role="radiogroup" aria-labelledby="model-heading" className="grid grid-cols-2 gap-2.5">
        {(
          [
            ["api", "Free / cheap API key", "Zhipu, DeepSeek, Qwen, Kimi"],
            ["ollama", "Ollama on this computer", "Free, private, no key"],
          ] as const
        ).map(([kind, title, hint]) => (
          <button
            key={kind}
            type="button"
            role="radio"
            aria-checked={value.kind === kind}
            onClick={() => onChange({ ...value, kind })}
            className={cn(
              "rounded-xl border p-3 text-left transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
              value.kind === kind
                ? "border-primary bg-accent ring-2 ring-primary/30"
                : "border-border bg-card hover:bg-muted",
            )}
          >
            <span className="block text-sm font-medium">{title}</span>
            <span className="mt-0.5 block text-xs text-muted-foreground">{hint}</span>
          </button>
        ))}
      </div>

      {value.kind === "api" ? (
        <div className="space-y-3 rounded-xl border border-border bg-card p-4">
          <div className="space-y-1.5">
            <Label htmlFor="provider">Provider</Label>
            <select
              id="provider"
              value={value.presetId}
              onChange={(e) => onChange(withPreset(value, e.target.value))}
              className="h-11 w-full rounded-lg border border-input bg-background px-3 text-base"
            >
              {PROVIDER_PRESETS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
              <option value={CUSTOM_PRESET_ID}>Other (OpenAI-compatible)</option>
            </select>
            {preset && (
              <a
                href={preset.signupUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-primary underline-offset-4 hover:underline"
              >
                Get a key from {preset.label.split(" (")[0]}
                <ExternalLink className="size-3.5" aria-hidden />
              </a>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="api-key">API key</Label>
            <Input
              id="api-key"
              type="password"
              autoComplete="off"
              spellCheck={false}
              placeholder="Paste your key"
              value={value.apiKey}
              onChange={(e) => onChange({ ...value, apiKey: e.target.value })}
              className="h-11 text-base"
            />
          </div>

          {isCustom && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="base-url">Address (base URL)</Label>
                <Input
                  id="base-url"
                  inputMode="url"
                  spellCheck={false}
                  value={value.baseUrl}
                  onChange={(e) => onChange({ ...value, baseUrl: e.target.value })}
                  className="h-11 text-base"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="model">Model</Label>
                <Input
                  id="model"
                  spellCheck={false}
                  value={value.model}
                  onChange={(e) => onChange({ ...value, model: e.target.value })}
                  className="h-11 text-base"
                />
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-3 rounded-xl border border-border bg-card p-4">
          <div className="space-y-1.5">
            <Label htmlFor="ollama-url">Ollama address</Label>
            <Input
              id="ollama-url"
              inputMode="url"
              spellCheck={false}
              value={value.ollamaUrl}
              onChange={(e) => onChange({ ...value, ollamaUrl: e.target.value })}
              className="h-11 text-base"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ollama-model">Model</Label>
            <Input
              id="ollama-model"
              spellCheck={false}
              value={value.ollamaModel}
              onChange={(e) => onChange({ ...value, ollamaModel: e.target.value })}
              className="h-11 text-base"
            />
          </div>
          <div className="space-y-1 text-sm text-muted-foreground">
            <p>Ollama must allow this website. On a Mac, run once in Terminal, then reopen Ollama:</p>
            <code className="block overflow-x-auto rounded-lg bg-muted px-3 py-2 text-xs">
              launchctl setenv OLLAMA_ORIGINS &quot;{typeof window !== "undefined" ? window.location.origin : "https://cpamukcu.github.io"}&quot;
            </code>
            <p>Works in Chrome, Edge and Firefox on the same computer. Safari blocks it.</p>
          </div>
        </div>
      )}
    </section>
  );
}
