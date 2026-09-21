import "server-only";
import { cookies } from "next/headers";
import { ACCESS_COOKIE, getAccessPassword, verifyAccessToken } from "@/lib/access";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export interface AppUser {
  id: string;
  email: string;
  name: string | null;
}

// Local-only shortcut: DEV_SKIP_AUTH=true in .env.local skips login entirely.
// It is ignored whenever NODE_ENV is "production" (next build / next start /
// any deployment), so it cannot disable auth on a live site.
export function isDevAuthBypass() {
  return (
    process.env.NODE_ENV !== "production" && process.env.DEV_SKIP_AUTH === "true"
  );
}

const SHARED_USER: AppUser = { id: "shared-access", email: "", name: "Learner" };

const DEV_USER: AppUser = {
  id: "dev-local-user",
  email: "local dev mode",
  name: "Learner",
};

// The signed-in user, or null. Uses getUser() (validated by Supabase).
export async function getCurrentUser(): Promise<AppUser | null> {
  if (isDevAuthBypass()) return DEV_USER;

  // Shared-password mode (ACCESS_PASSWORD): no Supabase involved.
  const password = getAccessPassword();
  if (password) {
    const token = (await cookies()).get(ACCESS_COOKIE)?.value;
    return token && (await verifyAccessToken(token, password)) ? SHARED_USER : null;
  }

  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const meta = user.user_metadata ?? {};
  return {
    id: user.id,
    email: user.email ?? "",
    name: meta.full_name ?? meta.name ?? user.email?.split("@")[0] ?? null,
  };
}
