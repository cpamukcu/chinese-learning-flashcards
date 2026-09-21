import { Flame, Languages, MessageCircleHeart, Mic, Target } from "lucide-react";

const steps = [
  {
    icon: Target,
    title: "Pick your level and a scene",
    body: "Choose HSK 1–6 and a scenario: ordering food, travel, shopping, a job interview, or free chat.",
  },
  {
    icon: Mic,
    title: "Talk out loud",
    body: "Hold the mic and speak. The tutor answers in natural Mandarin at your level, then asks you something back.",
  },
  {
    icon: MessageCircleHeart,
    title: "Get gentle corrections",
    body: "After each turn you see a short card: what you said, a better way to say it, and why. No lectures.",
  },
];

const extras = [
  {
    icon: Languages,
    title: "Characters, pinyin, English",
    body: "Every message shows all three. Turn each one on or off.",
  },
  {
    icon: Flame,
    title: "A daily habit",
    body: "Set a goal, watch your minutes spoken, and keep your streak alive.",
  },
];

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="scroll-mt-20 border-y border-border/60 bg-secondary/50 py-16 sm:py-24"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
            Ten minutes of real speaking beats an hour of flashcards
          </h2>
          <p className="mt-3 text-lg text-muted-foreground">
            A patient Chinese friend on call, any time you have a few minutes.
          </p>
        </div>

        <ol className="mt-12 grid gap-5 md:grid-cols-3">
          {steps.map((step, i) => (
            <li
              key={step.title}
              className="rounded-2xl border border-border bg-card p-6"
            >
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-accent text-accent-foreground">
                  <step.icon className="size-5" aria-hidden />
                </span>
                <span className="text-sm font-medium text-muted-foreground">
                  Step {i + 1}
                </span>
              </div>
              <h3 className="mt-4 text-lg font-semibold">{step.title}</h3>
              <p className="mt-2 text-muted-foreground">{step.body}</p>
            </li>
          ))}
        </ol>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          {extras.map((item) => (
            <div
              key={item.title}
              className="flex gap-4 rounded-2xl border border-border bg-card p-6"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground">
                <item.icon className="size-5" aria-hidden />
              </span>
              <div>
                <h3 className="font-semibold">{item.title}</h3>
                <p className="mt-1 text-muted-foreground">{item.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
