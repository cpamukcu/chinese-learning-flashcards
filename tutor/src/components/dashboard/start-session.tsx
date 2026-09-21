import { Mic } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export function StartSession() {
  return (
    <div className="rounded-2xl border border-primary/30 bg-accent/50 p-5 text-center sm:p-6">
      <h2 className="text-xl font-semibold">Ready to talk?</h2>
      <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
        Speak with your tutor: tap the mic and talk, or type if you prefer.
      </p>
      <Link
        href="/session"
        className={buttonVariants({
          size: "lg",
          className: "mt-4 w-full sm:w-auto",
        })}
      >
        <Mic aria-hidden />
        Start today&apos;s session
      </Link>
    </div>
  );
}
