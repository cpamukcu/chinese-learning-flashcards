import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { startHref } from "@/lib/site";
import { buttonVariants } from "@/components/ui/button";
import { ChatPreview } from "./chat-preview";

export function Hero() {
  return (
    <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-16 pt-12 sm:px-6 md:pt-20 lg:grid-cols-[1.05fr_1fr] lg:pb-24">
      <div className="text-center lg:text-left">
        <p className="font-zh mb-4 text-lg text-primary">每天说中文</p>
        <h1 className="text-balance text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
          Speak Mandarin out loud,{" "}
          <span className="text-primary">every day.</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-pretty text-lg text-muted-foreground lg:mx-0">
          A patient AI tutor on call for ten minutes a day. It speaks Mandarin,
          listens to you, and gently fixes your mistakes without breaking the
          flow.
        </p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
          <Link
            href={startHref}
            className={buttonVariants({
              size: "lg",
              className: "w-full sm:w-auto",
            })}
          >
            Start speaking free
            <ArrowRight aria-hidden />
          </Link>
          <a
            href="#how-it-works"
            className={buttonVariants({
              variant: "ghost",
              size: "lg",
              className: "w-full sm:w-auto",
            })}
          >
            See how it works
          </a>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          Free during beta · Works on your phone or laptop · HSK 1–4
        </p>
      </div>
      <div className="flex justify-center lg:justify-end">
        <ChatPreview />
      </div>
    </section>
  );
}
