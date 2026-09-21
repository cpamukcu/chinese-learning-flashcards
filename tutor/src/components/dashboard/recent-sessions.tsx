import { MessagesSquare } from "lucide-react";

// Reads from the sessions table in Milestone 4.
export function RecentSessions() {
  return (
    <section aria-labelledby="recent-heading">
      <h2 id="recent-heading" className="mb-3 text-lg font-semibold">
        Recent sessions
      </h2>
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border px-6 py-10 text-center">
        <MessagesSquare className="size-8 text-muted-foreground/60" aria-hidden />
        <p className="font-medium">No sessions yet</p>
        <p className="text-sm text-muted-foreground">
          Your conversations will show up here.
        </p>
      </div>
    </section>
  );
}
