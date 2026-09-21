import { describe, expect, it } from "vitest";
import { parseTutorReply, TutorParseError } from "./parse";

const valid = {
  reply_zh: "你好！你今天想吃什么？",
  reply_en: "Hello! What do you want to eat today?",
  correction: {
    original: "我想吃饭米",
    better: "我想吃米饭",
    explanation: "Word order: 米饭 (rice) is one word.",
  },
  new_words: [{ zh: "米饭", en: "cooked rice" }],
};

describe("parseTutorReply", () => {
  it("parses a valid reply and fills in pinyin locally", () => {
    const reply = parseTutorReply(JSON.stringify(valid));
    expect(reply.reply_zh).toBe("你好！你今天想吃什么？");
    expect(reply.reply_pinyin).toBe("Nǐ hǎo! Nǐ jīn tiān xiǎng chī shén me?");
    expect(reply.reply_en).toBe("Hello! What do you want to eat today?");
    expect(reply.correction).toEqual(valid.correction);
    expect(reply.new_words).toEqual([
      { zh: "米饭", en: "cooked rice", pinyin: "mǐfàn" },
    ]);
  });

  it("keeps model-supplied pinyin", () => {
    const reply = parseTutorReply(
      JSON.stringify({ ...valid, reply_pinyin: "custom pinyin" }),
    );
    expect(reply.reply_pinyin).toBe("custom pinyin");
  });

  it("accepts a null correction", () => {
    const reply = parseTutorReply(JSON.stringify({ ...valid, correction: null }));
    expect(reply.correction).toBeNull();
  });

  it("treats a correction that changes nothing as null", () => {
    const reply = parseTutorReply(
      JSON.stringify({
        ...valid,
        correction: { original: "你好", better: "你好", explanation: "same" },
      }),
    );
    expect(reply.correction).toBeNull();
  });

  it("treats an incomplete correction as null", () => {
    const reply = parseTutorReply(
      JSON.stringify({ ...valid, correction: { original: "我想吃饭米" } }),
    );
    expect(reply.correction).toBeNull();
  });

  it("strips a markdown code fence", () => {
    const reply = parseTutorReply("```json\n" + JSON.stringify(valid) + "\n```");
    expect(reply.reply_zh).toBe(valid.reply_zh);
  });

  it("finds JSON surrounded by prose", () => {
    const reply = parseTutorReply(`Here you go: ${JSON.stringify(valid)} Enjoy!`);
    expect(reply.reply_zh).toBe(valid.reply_zh);
  });

  it("defaults missing optional fields", () => {
    const reply = parseTutorReply(JSON.stringify({ reply_zh: "好的。" }));
    expect(reply.reply_en).toBe("");
    expect(reply.correction).toBeNull();
    expect(reply.new_words).toEqual([]);
  });

  it("drops malformed new_words and caps the list at 5", () => {
    const words = [
      ...Array.from({ length: 8 }, (_, i) => ({ zh: `词${i}`, en: `word ${i}` })),
    ];
    const reply = parseTutorReply(
      JSON.stringify({
        ...valid,
        new_words: [{ zh: "", en: "empty" }, "oops", null, ...words],
      }),
    );
    expect(reply.new_words).toHaveLength(5);
    expect(reply.new_words[0].zh).toBe("词0");
  });

  it("ignores new_words that is not an array", () => {
    const reply = parseTutorReply(JSON.stringify({ ...valid, new_words: "米饭" }));
    expect(reply.new_words).toEqual([]);
  });

  it("drops a reply_en that is really Chinese, but keeps English quoting Chinese", () => {
    expect(
      parseTutorReply(JSON.stringify({ ...valid, reply_en: "你好，最近怎么样？" })).reply_en,
    ).toBe("");
    expect(
      parseTutorReply(JSON.stringify({ ...valid, reply_en: "Say 你好 to greet someone." })).reply_en,
    ).toBe("Say 你好 to greet someone.");
  });

  it("throws when reply_zh is missing or blank", () => {
    expect(() => parseTutorReply(JSON.stringify({ reply_en: "hi" }))).toThrow(
      TutorParseError,
    );
    expect(() => parseTutorReply(JSON.stringify({ reply_zh: "  " }))).toThrow(
      TutorParseError,
    );
  });

  it("throws when reply_zh has no Chinese in it", () => {
    expect(() => parseTutorReply(JSON.stringify({ reply_zh: "Hello there" }))).toThrow(
      TutorParseError,
    );
  });

  it("throws when reply_zh slips into Japanese", () => {
    expect(() =>
      parseTutorReply(JSON.stringify({ reply_zh: "こんにちは，欢迎光临。" })),
    ).toThrow(TutorParseError);
  });

  it("throws on non-JSON and on truncated JSON", () => {
    expect(() => parseTutorReply("Sorry, I can't do that.")).toThrow(TutorParseError);
    expect(() => parseTutorReply('{"reply_zh": "你好')).toThrow(TutorParseError);
    expect(() => parseTutorReply("")).toThrow(TutorParseError);
  });
});
