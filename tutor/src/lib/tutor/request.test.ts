import { describe, expect, it } from "vitest";
import { LIMITS } from "./config";
import { parseTutorRequest } from "./request";

const base = { scenario: "ordering-food", level: 2 };

function ok(result: ReturnType<typeof parseTutorRequest>) {
  if (!result.ok) throw new Error(`expected ok, got: ${result.error}`);
  return result.value;
}

describe("parseTutorRequest", () => {
  it("accepts an empty history (session start)", () => {
    expect(ok(parseTutorRequest({ ...base, messages: [] })).messages).toEqual([]);
  });

  it("accepts a normal conversation and trims text", () => {
    const value = ok(
      parseTutorRequest({
        ...base,
        messages: [
          { role: "tutor", text: "你好！" },
          { role: "user", text: "  你好  " },
        ],
      }),
    );
    expect(value.messages[1].text).toBe("你好");
  });

  it("rejects non-objects and bad scenario / level", () => {
    expect(parseTutorRequest(null).ok).toBe(false);
    expect(parseTutorRequest("x").ok).toBe(false);
    expect(parseTutorRequest({ ...base, scenario: "hacking", messages: [] }).ok).toBe(false);
    expect(parseTutorRequest({ ...base, level: 7, messages: [] }).ok).toBe(false);
    expect(parseTutorRequest({ ...base, level: "2", messages: [] }).ok).toBe(false);
    expect(parseTutorRequest({ ...base, level: 2.5, messages: [] }).ok).toBe(false);
  });

  it("rejects bad message shapes", () => {
    const bad = (messages: unknown) =>
      parseTutorRequest({ ...base, messages }).ok;
    expect(bad("hi")).toBe(false);
    expect(bad([null])).toBe(false);
    expect(bad([{ role: "system", text: "x" }])).toBe(false);
    expect(bad([{ role: "user", text: 5 }])).toBe(false);
    expect(bad([{ role: "user", text: "   " }])).toBe(false);
  });

  it("rejects overlong messages", () => {
    const text = "好".repeat(LIMITS.maxMessageChars + 1);
    expect(parseTutorRequest({ ...base, messages: [{ role: "user", text }] }).ok).toBe(false);
  });

  it("requires the learner to have spoken last", () => {
    const result = parseTutorRequest({
      ...base,
      messages: [{ role: "tutor", text: "你好！" }],
    });
    expect(result.ok).toBe(false);
  });

  it("keeps only the most recent turns", () => {
    const messages = Array.from({ length: 30 }, (_, i) => ({
      role: i % 2 === 0 ? "tutor" : "user",
      text: `第${i}句`,
    }));
    const value = ok(parseTutorRequest({ ...base, messages }));
    expect(value.messages).toHaveLength(LIMITS.maxHistoryTurns);
    expect(value.messages.at(-1)?.text).toBe("第29句");
  });

  it("rejects absurdly long histories outright", () => {
    const messages = Array.from({ length: LIMITS.maxHistoryTurns * 3 + 1 }, () => ({
      role: "user",
      text: "好",
    }));
    expect(parseTutorRequest({ ...base, messages }).ok).toBe(false);
  });
});
