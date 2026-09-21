import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { SessionView } from "@/components/session/session-view";
import { getCurrentUser } from "@/lib/auth";
import { IS_STATIC } from "@/lib/static-mode";

export const metadata: Metadata = { title: "Session" };

export default async function SessionPage() {
  // The static edition has no login and is built once, so skip both checks.
  if (!IS_STATIC) {
    // Per-user page: render per request, never at build time.
    await connection();
    if (!(await getCurrentUser())) redirect("/login");
  }

  return <SessionView />;
}
