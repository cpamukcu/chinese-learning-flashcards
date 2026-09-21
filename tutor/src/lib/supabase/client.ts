import { createBrowserClient } from "@supabase/ssr";
import { requireSupabasePublicEnv } from "./env";

// Browser client: anon key only, protected by row-level security.
export function createClient() {
  const { url, anonKey } = requireSupabasePublicEnv();
  return createBrowserClient(url, anonKey);
}
