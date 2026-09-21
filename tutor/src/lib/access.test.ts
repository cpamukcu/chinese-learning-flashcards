import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ACCESS_MAX_AGE_SECONDS,
  createAccessToken,
  isPasswordMode,
  passwordMatches,
  verifyAccessToken,
} from "./access";

afterEach(() => vi.unstubAllEnvs());

describe("access tokens", () => {
  it("accepts a token it created", async () => {
    const token = await createAccessToken("correct horse");
    expect(await verifyAccessToken(token, "correct horse")).toBe(true);
  });

  it("rejects a token signed with a different password (changing it logs everyone out)", async () => {
    const token = await createAccessToken("old password");
    expect(await verifyAccessToken(token, "new password")).toBe(false);
  });

  it("rejects an expired token", async () => {
    const created = Date.now();
    const token = await createAccessToken("pw-12345678", created);
    const later = created + (ACCESS_MAX_AGE_SECONDS + 1) * 1000;
    expect(await verifyAccessToken(token, "pw-12345678", later)).toBe(false);
    expect(await verifyAccessToken(token, "pw-12345678", created + 1000)).toBe(true);
  });

  it("rejects a token whose expiry was edited", async () => {
    const token = await createAccessToken("pw-12345678");
    const [expires, signature] = token.split(".");
    const forged = `${Number(expires) + 99999}.${signature}`;
    expect(await verifyAccessToken(forged, "pw-12345678")).toBe(false);
  });

  it.each(["", "garbage", "123.", ".abc", "abc.def", "9999999999.zz", "9999999999.abc"])(
    "rejects malformed token %j",
    async (token) => {
      expect(await verifyAccessToken(token, "pw-12345678")).toBe(false);
    },
  );
});

describe("passwordMatches", () => {
  it("matches only the exact password", async () => {
    expect(await passwordMatches("open sesame", "open sesame")).toBe(true);
    expect(await passwordMatches("open sesamE", "open sesame")).toBe(false);
    expect(await passwordMatches("", "open sesame")).toBe(false);
    expect(await passwordMatches("open sesame ", "open sesame")).toBe(false);
  });

  it("handles Chinese passwords", async () => {
    expect(await passwordMatches("学中文很好玩", "学中文很好玩")).toBe(true);
    expect(await passwordMatches("学中文很好", "学中文很好玩")).toBe(false);
  });
});

describe("isPasswordMode", () => {
  it("is on only when ACCESS_PASSWORD is set", () => {
    vi.stubEnv("ACCESS_PASSWORD", "");
    expect(isPasswordMode()).toBe(false);
    vi.stubEnv("ACCESS_PASSWORD", "something-long");
    expect(isPasswordMode()).toBe(true);
  });
});
