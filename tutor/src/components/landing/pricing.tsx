import { Check } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Business model is undecided (spec §13), so no prices are shown yet.
const free = [
  "A daily speaking allowance",
  "All scenarios and HSK levels",
  "Live transcript with pinyin and English",
  "Correction cards and daily streak",
];
const pro = [
  "Longer daily sessions",
  "Pronunciation and tone scoring",
  "Saved vocabulary and flashcards",
  "Weekly progress reports",
];

function Feature({ children }: { children: string }) {
  return (
    <li className="flex gap-3">
      <Check className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
      <span>{children}</span>
    </li>
  );
}

export function Pricing() {
  return (
    <section id="pricing" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Free while we&apos;re in beta
        </h2>
        <p className="mt-3 text-lg text-muted-foreground">
          Start speaking today. Paid plans will come later, and you&apos;ll hear
          about them before anything changes.
        </p>
      </div>

      <div className="mx-auto mt-12 grid max-w-3xl gap-5 md:grid-cols-2">
        <Card className="border-primary/40 ring-2 ring-primary/20">
          <CardHeader>
            <CardTitle className="text-xl">Free beta</CardTitle>
            <p className="text-3xl font-bold">Free</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <ul className="space-y-3">
              {free.map((f) => (
                <Feature key={f}>{f}</Feature>
              ))}
            </ul>
            <Link
              href="/login"
              className={buttonVariants({ size: "lg", className: "w-full" })}
            >
              Start speaking free
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Pro</CardTitle>
            <p className="text-3xl font-bold text-muted-foreground">
              Coming later
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <ul className="space-y-3 text-muted-foreground">
              {pro.map((f) => (
                <Feature key={f}>{f}</Feature>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
