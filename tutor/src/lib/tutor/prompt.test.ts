import { describe, expect, it } from "vitest";
import { buildApiMessages, buildSystemPrompt, START_MARKER } from "./prompt";

describe("buildSystemPrompt", () => {
  it("includes the level and scenario", () => {
    const prompt = buildSystemPrompt("job-interview", 4);
    expect(prompt).toContain("HSK 4");
    expect(prompt).toContain("Job interview");
    expect(prompt).toContain("interviewer");
  });

  it("tells the model to keep corrections out of the spoken reply", () => {
    expect(buildSystemPrompt("free-chat", 1)).toMatch(/correction/);
  });
});

describe("buildApiMessages", () => {
  it("opens with the START marker so the API sees a user turn first", () => {
    expect(buildApiMessages([])).toEqual([{ role: "user", content: START_MARKER }]);
  });

  it("maps tutor → assistant and keeps roles alternating", () => {
    const messages = buildApiMessages([
      { role: "tutor", text: "你好！" },
      { role: "user", text: "你好" },
    ]);
    expect(messages.map((m) => m.role)).toEqual(["user", "assistant", "user"]);
    expect(messages[1].content).toBe("你好！");
  });

  it("merges consecutive same-role turns", () => {
    const messages = buildApiMessages([
      { role: "tutor", text: "你好！" },
      { role: "user", text: "我" },
      { role: "user", text: "很好" },
    ]);
    expect(messages.map((m) => m.role)).toEqual(["user", "assistant", "user"]);
    expect(messages[2].content).toBe("我\n很好");
  });
});
