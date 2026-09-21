import { afterEach, describe, expect, it, vi } from "vitest";
import { TutorProviderError } from "./errors";
import { runOllamaTurn } from "./ollama";
import { TutorParseError } from "./parse";
import type { TutorRequest } from "./types";

const request: TutorRequest = {
  scenario: "ordering-food",
  level: 2,
  messages: [
    { role: "tutor", text: "你好！你想吃什么？" },
    { role: "user", text: "我想吃饭米" },
  ],
};

const goodReply = {
  reply_zh: "好的，一份米饭。还要别的吗？",
  reply_en: "OK, one rice. Anything else?",
  correction: { original: "我想吃饭米", better: "我想吃米饭", explanation: "Word order." },
  new_words: [],
};

const ok = (content: string) =>
  new Response(JSON.stringify({ message: { role: "assistant", content } }), { status: 200 });

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("runOllamaTurn", () => {
  it("sends the schema, system prompt and history, and parses the reply", async () => {
    const fetchMock = vi.fn().mockResolvedValue(ok(JSON.stringify(goodReply)));
    vi.stubGlobal("fetch", fetchMock);

    const reply = await runOllamaTurn(request);

    expect(reply.correction?.better).toBe("我想吃米饭");
    expect(reply.reply_pinyin).toContain("mǐ");

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("http://localhost:11434/api/chat");
    const body = JSON.parse(init.body);
    expect(body.model).toBe("qwen2.5:3b");
    expect(body.stream).toBe(false);
    expect(body.format.required).toContain("reply_zh");
    expect(body.messages[0].role).toBe("system");
    expect(body.messages.at(-1)).toEqual({ role: "user", content: "我想吃饭米" });
  });

  it("honours OLLAMA_MODEL and OLLAMA_BASE_URL", async () => {
    vi.stubEnv("OLLAMA_MODEL", "qwen2.5:7b");
    vi.stubEnv("OLLAMA_BASE_URL", "http://example.test:1234");
    const fetchMock = vi.fn().mockResolvedValue(ok(JSON.stringify(goodReply)));
    vi.stubGlobal("fetch", fetchMock);

    await runOllamaTurn(request);

    expect(fetchMock.mock.calls[0][0]).toBe("http://example.test:1234/api/chat");
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).model).toBe("qwen2.5:7b");
  });

  it("explains that Ollama isn't running when the connection fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("fetch failed")));
    await expect(runOllamaTurn(request)).rejects.toMatchObject({
      name: "TutorProviderError",
      code: "ollama_down",
    });
  });

  it("tells the user which model to pull when it is missing", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response('{"error":"model \\"qwen2.5:3b\\" not found"}', { status: 404 })),
    );
    const error = await runOllamaTurn(request).catch((e) => e);
    expect(error).toBeInstanceOf(TutorProviderError);
    expect(error.code).toBe("ollama_model_missing");
    expect(error.message).toContain("ollama pull qwen2.5:3b");
  });

  it("rejects a reply with no Chinese", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(ok(JSON.stringify({ ...goodReply, reply_zh: "Hello there" }))),
    );
    await expect(runOllamaTurn(request)).rejects.toBeInstanceOf(TutorParseError);
  });

  it("rejects an empty or missing message body", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: 200 })));
    await expect(runOllamaTurn(request)).rejects.toBeInstanceOf(TutorParseError);
  });
});

describe("runOllamaTurn corrections (focused sentence check)", () => {
  const replyOnly = { ...goodReply, correction: null };

  // Routes by prompt: the focused check has its own system prompt.
  function stubOllama(check: unknown | Error) {
    const fetchMock = vi.fn(async (_url: string, init: { body: string }) => {
      const body = JSON.parse(init.body);
      if (String(body.messages[0].content).includes("careful Mandarin teacher")) {
        if (check instanceof Error) throw check;
        return ok(JSON.stringify(check));
      }
      return ok(JSON.stringify(replyOnly));
    });
    vi.stubGlobal("fetch", fetchMock);
    return fetchMock;
  }

  const chineseTurn: TutorRequest = {
    scenario: "ordering-food",
    level: 2,
    messages: [
      { role: "tutor", text: "你想吃什么？" },
      { role: "user", text: "我想吃饭米" },
    ],
  };

  it("uses the focused check's correction", async () => {
    stubOllama({ corrected: "我想吃米饭。", explanation: "米饭 is one word." });
    const reply = await runOllamaTurn(chineseTurn);
    expect(reply.correction).toEqual({
      original: "我想吃饭米",
      better: "我想吃米饭。",
      explanation: "米饭 is one word.",
    });
  });

  it("returns no correction when the sentence comes back unchanged", async () => {
    stubOllama({ corrected: "我想吃饭米！", explanation: "" });
    expect((await runOllamaTurn(chineseTurn)).correction).toBeNull();
  });

  it("drops a rewrite that has no explanation", async () => {
    stubOllama({ corrected: "他想吃米饭", explanation: "" });
    expect((await runOllamaTurn(chineseTurn)).correction).toBeNull();
  });

  it("replaces a Chinese-language explanation with a neutral English note", async () => {
    stubOllama({ corrected: "我想吃米饭", explanation: "米饭是一个词。" });
    const { correction } = await runOllamaTurn(chineseTurn);
    expect(correction?.better).toBe("我想吃米饭");
    expect(correction?.explanation).toBe("A more natural way to say this.");
  });

  it("rejects rambling or Japanese 'corrections'", async () => {
    stubOllama({ corrected: "こんにちは", explanation: "greeting" });
    expect((await runOllamaTurn(chineseTurn)).correction).toBeNull();
    stubOllama({ corrected: "我想吃米饭".repeat(10), explanation: "long" });
    expect((await runOllamaTurn(chineseTurn)).correction).toBeNull();
  });

  it("skips the check for English input and for the opening turn", async () => {
    const fetchMock = stubOllama({ corrected: "x", explanation: "y" });
    await runOllamaTurn({ ...chineseTurn, messages: [{ role: "user", text: "how do I say water" }] });
    await runOllamaTurn({ ...chineseTurn, messages: [] });
    const checks = fetchMock.mock.calls.filter(([, init]) =>
      JSON.parse(init.body).messages[0].content.includes("careful Mandarin teacher"),
    );
    expect(checks).toHaveLength(0);
  });

  it("still replies if the check itself fails", async () => {
    stubOllama(new TypeError("boom"));
    const reply = await runOllamaTurn(chineseTurn);
    expect(reply.reply_zh).toContain("米饭");
    expect(reply.correction).toBeNull();
  });
});
