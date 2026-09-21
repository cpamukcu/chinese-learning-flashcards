import { redirect } from "next/navigation";
import { connection } from "next/server";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { getCurrentUser } from "@/lib/auth";
import { IS_STATIC } from "@/lib/static-mode";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // The static edition has no login and is built once, so skip both checks.
  let email = "";
  if (!IS_STATIC) {
    // Per-user pages must render per request, never at build time.
    await connection();
    const user = await getCurrentUser();
    if (!user) redirect("/login");
    email = user.email;
  }

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <DashboardNav email={email} />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-28 pt-6 sm:px-6 sm:pb-12 sm:pt-10">
        {children}
      </main>
    </div>
  );
}
