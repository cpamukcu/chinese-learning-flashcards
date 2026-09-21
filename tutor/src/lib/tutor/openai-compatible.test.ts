import { afterEach, describe, expect, it, vi } from "vitest";
import { runOpenAICompatibleTurn } from "./openai-compatible";
import type { TutorRequest } from "./types";

const request: TutorRequest = {
  scenario: "shopping",
  level: 3,
  messages: [
    { role: "tutor", text: "欢迎光临！你想买什么？" },
    { role: "user", text: "我想买一件衣服" },
  ],
};

const reply = {
  reply_zh: "好的，你要什么颜色的？",
  reply_en: "OK, what colour do you want?",
  correction: null,
  new_words: [],
};

const completion = (content: string) =>
  new Response(JSON.stringify({ choices: [{ message: { role: "assistant", content } }] }), {
    status: 200,
  });

// The focused sentence check has its own system prompt; answer it "unchanged".
function stub(handler?: (body: { messages: { content: string }[] }) => Response) {
  const fetchMock = vi.fn(async (_url: string, init: { body: string; headers?: Record<string, string> }) => {
    const body = JSON.parse(init.body);
    if (handler) return handler(body);
    if (String(body.messages[0].content).includes("careful Mandarin teacher")) {
      return completion(JSON.stringify({ corrected: "我想买一件衣服", explanation: "" }));
    }
    return completion(JSON.stringify(reply));
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("runOpenAICompatibleTurn", () => {
  it("calls chat/completions with key, model, JSON mode and the schema in the prompt", async () => {
    vi.stubEnv("LLM_API_KEY", "test-key");
    vi.stubEnv("LLM_BASE_URL", "https://llm.example.cn/v1/");
    vi.stubEnv("LLM_MODEL", "some-model");
    const fetchMock = stub();

    const result = await runOpenAICompatibleTurn(request);
    expect(result.reply_zh).toBe("好的，你要什么颜色的？");
    expect(result.reply_pinyin).toContain("Hǎo");

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://llm.example.cn/v1/chat/completions"); // trailing slash trimmed
    expect(init.headers?.Authorization).toBe("Bearer test-key");
    const body = JSON.parse(init.body);
    expect(body.model).toBe("some-model");
    expect(body.response_format).toEqual({ type: "json_object" });
    expect(body.messages[0].role).toBe("system");
    expect(body.messages[0].content).toContain("JSON Schema");
    expect(body.messages[0].content).toContain("reply_zh");
  });

  it("defaults to the Zhipu endpoint and glm-4-flash", async () => {
    vi.stubEnv("LLM_API_KEY", "k");
    const fetchMock = stub();
    await runOpenAICompatibleTurn(request);
    expect(fetchMock.mock.calls[0][0]).toBe("https://open.bigmodel.cn/api/paas/v4/chat/completions");
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).model).toBe("glm-4-flash");
  });

  it("reports a missing key without calling the network", async () => {
    vi.stubEnv("LLM_API_KEY", "");
    const fetchMock = stub();
    await expect(runOpenAICompatibleTurn(request)).rejects.toMatchObject({ code: "llm_key_missing" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    [401, "llm_auth"],
    [403, "llm_auth"],
    [402, "llm_no_credit"],
    [429, "llm_rate_limited"],
    [500, "llm_error"],
  ])("maps HTTP %i to %s", async (status, code) => {
    vi.stubEnv("LLM_API_KEY", "k");
    stub(() => new Response("{}", { status }));
    await expect(runOpenAICompatibleTurn(request)).rejects.toMatchObject({ code });
  });

  it("recognises an out-of-quota message even on a 400", async () => {
    vi.stubEnv("LLM_API_KEY", "k");
    stub(() => new Response('{"error":{"message":"Insufficient balance"}}', { status: 400 }));
    await expect(runOpenAICompatibleTurn(request)).rejects.toMatchObject({ code: "llm_no_credit" });
  });

  it("explains an unreachable provider", async () => {
    vi.stubEnv("LLM_API_KEY", "k");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("fetch failed")));
    await expect(runOpenAICompatibleTurn(request)).rejects.toMatchObject({ code: "llm_unreachable" });
  });

  it("uses the focused check to add a correction", async () => {
    vi.stubEnv("LLM_API_KEY", "k");
    stub((body) =>
      String(body.messages[0].content).includes("careful Mandarin teacher")
        ? completion(JSON.stringify({ corrected: "我想买一件衣服。", explanation: "x" }))
        : completion(JSON.stringify(reply)),
    );
    const result = await runOpenAICompatibleTurn({
      ...request,
      messages: [request.messages[0], { role: "user", text: "我想买衣服一件" }],
    });
    expect(result.correction?.original).toBe("我想买衣服一件");
  });
});
