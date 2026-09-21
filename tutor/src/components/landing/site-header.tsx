import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { IS_STATIC } from "@/lib/static-mode";
import { startHref } from "@/lib/site";
import { buttonVariants } from "@/components/ui/button";

const links = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Logo />
        <nav aria-label="Main" className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {!IS_STATIC && (
            <Link href="/login" className={buttonVariants({ variant: "ghost" })}>
              Log in
            </Link>
          )}
          <Link
            href={startHref}
            className={buttonVariants({ className: IS_STATIC ? "" : "hidden sm:inline-flex" })}
          >
            Start free
          </Link>
        </div>
      </div>
    </header>
  );
}
