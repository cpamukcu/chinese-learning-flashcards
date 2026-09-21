import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

// Only allow same-site relative redirects (blocks open-redirect via ?next=).
function safeNext(value: string | null) {
  return value && value.startsWith("/") && !value.startsWith("//")
    ? value
    : "/dashboard";
}

// Handles both flows:
//  - ?code=…                     Google OAuth and PKCE magic links
//  - ?token_hash=…&type=email    magic links using the optional email template
//    from the README (works when the link is opened on a different device)
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const fail = () => NextResponse.redirect(`${origin}/login?error=auth`);

  if (!isSupabaseConfigured()) return fail();

  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  const supabase = await createClient();
  let error: Error | null = null;

  if (code) {
    ({ error } = await supabase.auth.exchangeCodeForSession(code));
  } else if (tokenHash && type) {
    ({ error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    }));
  } else {
    return fail();
  }

  if (error) return fail();
  return NextResponse.redirect(`${origin}${safeNext(searchParams.get("next"))}`);
}
