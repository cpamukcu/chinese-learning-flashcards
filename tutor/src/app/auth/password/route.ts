import { NextResponse, type NextRequest } from "next/server";
import {
  ACCESS_COOKIE,
  ACCESS_MAX_AGE_SECONDS,
  MIN_PASSWORD_LENGTH,
  createAccessToken,
  getAccessPassword,
  passwordMatches,
} from "@/lib/access";

// Slows down password guessing: 8 wrong tries per IP per 15 minutes.
// In-memory, which suits a single server process (one VPS). It resets on restart.
const MAX_ATTEMPTS = 8;
const WINDOW_MS = 15 * 60 * 1000;
const attempts = new Map<string, { count: number; resetAt: number }>();

function clientId(request: NextRequest) {
  return request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
}

function json(status: number, message: string) {
  return NextResponse.json({ ok: false, message }, { status });
}

export async function POST(request: NextRequest) {
  const password = getAccessPassword();
  if (!password) return json(404, "Password login is not enabled.");
  if (password.length < MIN_PASSWORD_LENGTH) {
    return json(
      500,
      `ACCESS_PASSWORD must be at least ${MIN_PASSWORD_LENGTH} characters. Change it in the server settings.`,
    );
  }

  const id = clientId(request);
  const now = Date.now();
  const record = attempts.get(id);
  if (record && record.resetAt > now && record.count >= MAX_ATTEMPTS) {
    return json(429, "Too many wrong attempts. Please try again in a few minutes.");
  }

  let submitted = "";
  try {
    const body: unknown = await request.json();
    if (typeof body === "object" && body !== null && "password" in body) {
      submitted = String((body as { password: unknown }).password).slice(0, 200);
    }
  } catch {
    return json(400, "Request body must be valid JSON.");
  }

  if (!(await passwordMatches(submitted, password))) {
    attempts.set(id, {
      count: record && record.resetAt > now ? record.count + 1 : 1,
      resetAt: record && record.resetAt > now ? record.resetAt : now + WINDOW_MS,
    });
    await new Promise((resolve) => setTimeout(resolve, 400)); // slow down guessing
    return json(401, "Wrong password.");
  }

  attempts.delete(id);
  const response = NextResponse.json({ ok: true });
  // "Secure" cookies are only sent over HTTPS; only set it when the request
  // really arrived over HTTPS, so a plain-HTTP server still works.
  const secure =
    request.headers.get("x-forwarded-proto") === "https" ||
    request.nextUrl.protocol === "https:";
  response.cookies.set(ACCESS_COOKIE, await createAccessToken(password), {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: ACCESS_MAX_AGE_SECONDS,
  });
  return response;
}
