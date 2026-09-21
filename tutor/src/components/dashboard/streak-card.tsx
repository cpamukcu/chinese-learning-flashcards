import { Flame } from "lucide-react";

export function StreakCard({ days }: { days: number }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 sm:flex-col sm:items-start sm:justify-center">
      <span className="grid size-11 place-items-center rounded-xl bg-accent text-primary">
        <Flame className="size-6" aria-hidden />
      </span>
      <div>
        <p className="text-3xl font-bold leading-none">
          {days}
          <span className="ml-1.5 text-base font-medium text-muted-foreground">
            {days === 1 ? "day" : "days"}
          </span>
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {days === 0 ? "Speak today to start a streak" : "Current streak"}
        </p>
      </div>
    </div>
  );
}
