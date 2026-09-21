import { ArrowRight } from "lucide-react";

// Static illustration of the session screen (built in Milestones 2–3).
export function ChatPreview() {
  return (
    <div
      role="img"
      aria-label="Example: the tutor asks what you want to eat, the learner replies with a word-order mistake, and a correction card shows the fix."
      className="w-full max-w-md space-y-3 rounded-3xl border border-border bg-card p-4 shadow-[0_20px_50px_-20px_rgba(120,50,20,0.25)] sm:p-5"
    >
      <div className="flex items-center gap-2 pb-1 text-xs text-muted-foreground">
        <span className="rounded-full bg-secondary px-2.5 py-1 font-medium text-secondary-foreground">
          HSK 2
        </span>
        <span className="rounded-full bg-secondary px-2.5 py-1 font-medium text-secondary-foreground">
          Ordering food
        </span>
      </div>

      <div className="max-w-[88%] rounded-2xl rounded-tl-md bg-muted px-4 py-3">
        <p className="font-zh text-xl leading-snug">你好！你今天想吃什么？</p>
        <p className="mt-1 text-sm text-primary">
          Nǐ hǎo! Nǐ jīntiān xiǎng chī shénme?
        </p>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Hello! What do you want to eat today?
        </p>
      </div>

      <div className="ml-auto max-w-[80%] rounded-2xl rounded-tr-md bg-primary px-4 py-3 text-primary-foreground">
        <p className="font-zh text-xl leading-snug">我想吃饭米</p>
      </div>

      <div className="rounded-2xl border border-accent bg-accent/60 px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-accent-foreground">
          Gentle correction
        </p>
        <p className="font-zh mt-1.5 flex flex-wrap items-center gap-x-2 text-lg">
          <span className="text-muted-foreground line-through decoration-primary/60">
            我想吃饭米
          </span>
          <ArrowRight className="size-4 text-primary" aria-hidden />
          <span className="font-medium">我想吃米饭</span>
        </p>
        <p className="mt-1 text-sm text-accent-foreground/80">
          Word order: 米饭 (rice) is one word.
        </p>
      </div>
    </div>
  );
}
