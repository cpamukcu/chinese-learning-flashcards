import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { TutorProviderError, TutorRefusalError } from "@/lib/tutor/errors";
import { TutorParseError } from "@/lib/tutor/parse";
import { parseTutorRequest } from "@/lib/tutor/request";
import { runTutorTurn } from "@/lib/tutor/run";

// Errors return { error: <code>, message: <safe text for the learner> }.
function fail(status: number, error: string, message: string) {
  return NextResponse.json({ error, message }, { status });
}

export async function POST(request: Request) {
  // Login is required so the endpoint can't be used to spend the API key.
  if (!(await getCurrentUser())) {
    return fail(401, "unauthorized", "Please log in to continue.");
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail(400, "bad_request", "Request body must be valid JSON.");
  }

  const parsed = parseTutorRequest(body);
  if (!parsed.ok) return fail(400, "bad_request", parsed.error);

  try {
    const reply = await runTutorTurn(parsed.value);
    return NextResponse.json({ reply });
  } catch (error) {
    // Details go to the server log only; never echo provider errors to the browser.
    console.error("[api/tutor]", error);

    if (error instanceof TutorProviderError) {
      return fail(error.status, error.code, error.message);
    }
    if (error instanceof TutorRefusalError) {
      return fail(422, "refused", "The tutor couldn't respond to that. Try rephrasing.");
    }
    if (error instanceof TutorParseError) {
      return fail(502, "bad_reply", "The tutor's reply was garbled. Please try again.");
    }
    if (error instanceof Anthropic.AuthenticationError) {
      return fail(503, "tutor_unavailable", "The tutor's API key was rejected by the provider.");
    }
    if (error instanceof Anthropic.RateLimitError) {
      return fail(429, "rate_limited", "The tutor is busy. Please try again in a moment.");
    }
    if (error instanceof Anthropic.APIConnectionError) {
      return fail(502, "provider_unreachable", "Couldn't reach the tutor service. Please try again.");
    }
    if (error instanceof Anthropic.APIError && /credit balance/i.test(error.message)) {
      return fail(
        402,
        "no_credit",
        "Your Anthropic account has no credit. Add funds at platform.claude.com → Billing, then try again.",
      );
    }
    if (error instanceof Anthropic.APIError) {
      return fail(502, "provider_error", "The tutor service had a problem. Please try again.");
    }
    return fail(500, "internal", "Something went wrong. Please try again.");
  }
}
