import type { Metadata } from "next";
import { GoalRing } from "@/components/dashboard/goal-ring";
import { RecentSessions } from "@/components/dashboard/recent-sessions";
import { StartSession } from "@/components/dashboard/start-session";
import { StreakCard } from "@/components/dashboard/streak-card";
import { getCurrentUser } from "@/lib/auth";
import { IS_STATIC } from "@/lib/static-mode";

export const metadata: Metadata = { title: "Today" };

// Placeholder numbers — Milestone 4 replaces these with daily_stats + profiles.
const TODAY_MINUTES = 0;
const DAILY_GOAL_MINUTES = 10;
const STREAK_DAYS = 0;

export default async function DashboardPage() {
  const user = IS_STATIC ? null : await getCurrentUser();
  const name = user?.name ?? "there";

  return (
    <div className="space-y-6">
      <div>
        <p className="font-zh text-primary">你好，{name}！</p>
        <h1 className="text-3xl font-bold tracking-tight">Today</h1>
      </div>

      <section className="grid gap-4 sm:grid-cols-[1.4fr_1fr]">
        <GoalRing minutes={TODAY_MINUTES} goal={DAILY_GOAL_MINUTES} />
        <StreakCard days={STREAK_DAYS} />
      </section>

      <StartSession />
      <RecentSessions />
    </div>
  );
}
