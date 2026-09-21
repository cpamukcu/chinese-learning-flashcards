// Shared-password access for a private group (you and a few friends). Needs no
// third-party service, so it works inside mainland China where Supabase and
// Google login are unreliable. Set ACCESS_PASSWORD to turn it on.
//
// After a correct password the server sets a signed, HttpOnly cookie. Uses the
// Web Crypto API so the same code runs in the proxy and in route handlers.
// The signing key comes from the password itself: changing ACCESS_PASSWORD
// logs everyone out.

export const ACCESS_COOKIE = "tutor_access";
export const MIN_PASSWORD_LENGTH = 8;
export const ACCESS_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export function getAccessPassword(): string | null {
  return process.env.ACCESS_PASSWORD || null;
}

export function isPasswordMode(): boolean {
  return getAccessPassword() !== null;
}

const encoder = new TextEncoder();

async function hmacKey(secret: string) {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(`tutor-access-v1:${secret}`),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

const toHex = (bytes: ArrayBuffer) =>
  [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, "0")).join("");

function fromHex(hex: string): Uint8Array<ArrayBuffer> | null {
  if (!/^[0-9a-f]+$/.test(hex) || hex.length % 2 !== 0) return null;
  const bytes = new Uint8Array(new ArrayBuffer(hex.length / 2));
  for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return bytes;
}

// Token format: "<expiry unix seconds>.<hex HMAC of the expiry>".
export async function createAccessToken(password: string, nowMs = Date.now()) {
  const expires = Math.floor(nowMs / 1000) + ACCESS_MAX_AGE_SECONDS;
  const signature = await crypto.subtle.sign(
    "HMAC",
    await hmacKey(password),
    encoder.encode(String(expires)),
  );
  return `${expires}.${toHex(signature)}`;
}

export async function verifyAccessToken(
  token: string,
  password: string,
  nowMs = Date.now(),
): Promise<boolean> {
  const [expiresPart, signaturePart] = token.split(".");
  if (!expiresPart || !signaturePart || !/^\d+$/.test(expiresPart)) return false;
  if (Number(expiresPart) * 1000 <= nowMs) return false;
  const signature = fromHex(signaturePart);
  if (!signature) return false;
  // subtle.verify compares in constant time.
  return crypto.subtle.verify(
    "HMAC",
    await hmacKey(password),
    signature,
    encoder.encode(expiresPart),
  );
}

// Constant-time comparison: hash both sides to equal length, then compare
// every byte without stopping early.
export async function passwordMatches(input: string, expected: string): Promise<boolean> {
  const [a, b] = await Promise.all(
    [input, expected].map(async (value) =>
      new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(value))),
    ),
  );
  let difference = 0;
  for (let i = 0; i < a.length; i++) difference |= a[i] ^ b[i];
  return difference === 0;
}
