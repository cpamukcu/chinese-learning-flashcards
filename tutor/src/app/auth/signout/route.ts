import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

// POST-only so a stray link or prefetch can't sign the user out.
export async function POST(request: NextRequest) {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  // 303 turns the POST into a GET on the landing page.
  return NextResponse.redirect(new URL("/", request.url), 303);
}
