import { describe, expect, it } from "vitest";
import { containsChinese } from "./chinese";
import { toPinyin, toWordPinyin } from "./pinyin";

describe("pinyin", () => {
  it("converts a sentence with tone marks and tidy punctuation", () => {
    expect(toPinyin("你好！")).toBe("Nǐ hǎo!");
    expect(toPinyin("我想吃米饭，谢谢。")).toBe("Wǒ xiǎng chī mǐ fàn, xiè xiè.");
  });

  it("returns empty string for text without Chinese", () => {
    expect(toPinyin("hello")).toBe("");
    expect(toPinyin("")).toBe("");
  });

  it("joins syllables for vocabulary words", () => {
    expect(toWordPinyin("米饭")).toBe("mǐfàn");
  });

  it("detects Chinese characters", () => {
    expect(containsChinese("hi 你")).toBe(true);
    expect(containsChinese("hi")).toBe(false);
  });
});
