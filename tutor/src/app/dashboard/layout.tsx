import { redirect } from "next/navigation";
import { connection } from "next/server";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { getCurrentUser } from "@/lib/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Per-user pages must render per request, never at build time.
  await connection();

  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <DashboardNav email={user.email} />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-28 pt-6 sm:px-6 sm:pb-12 sm:pt-10">
        {children}
      </main>
    </div>
  );
}
