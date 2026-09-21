import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { SessionView } from "@/components/session/session-view";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Session" };

export default async function SessionPage() {
  // Per-user page: render per request, never at build time.
  await connection();

  if (!(await getCurrentUser())) redirect("/login");

  return <SessionView />;
}
