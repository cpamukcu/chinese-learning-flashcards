import { BookOpen, Home, Settings } from "lucide-react";
import { IS_STATIC } from "@/lib/static-mode";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

// History and Settings pages land in Milestone 4+, so they render disabled.
const items = [
  { label: "Today", icon: Home, active: true },
  { label: "History", icon: BookOpen, active: false },
  { label: "Settings", icon: Settings, active: false },
];

export function DashboardNav({ email }: { email: string }) {
  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between gap-3 px-4 sm:px-6">
          <Logo />

          <nav aria-label="Dashboard" className="hidden items-center gap-1 sm:flex">
            {items.map((item) => (
              <span
                key={item.label}
                aria-current={item.active ? "page" : undefined}
                className={
                  item.active
                    ? "rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground"
                    : "rounded-lg px-3 py-1.5 text-sm text-muted-foreground/60"
                }
              >
                {item.label}
                {!item.active && <span className="sr-only"> (coming soon)</span>}
              </span>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            {email && (
              <span className="hidden max-w-[12rem] truncate text-sm text-muted-foreground md:block">
                {email}
              </span>
            )}
            {!IS_STATIC && (
              <form action="/auth/signout" method="post">
                <Button type="submit" variant="outline" size="sm">
                  Sign out
                </Button>
              </form>
            )}
          </div>
        </div>
      </header>

      <nav
        aria-label="Dashboard"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur sm:hidden"
      >
        <ul className="mx-auto grid max-w-md grid-cols-3">
          {items.map((item) => (
            <li
              key={item.label}
              aria-current={item.active ? "page" : undefined}
              className={
                item.active
                  ? "flex flex-col items-center gap-1 py-2.5 text-xs font-medium text-primary"
                  : "flex flex-col items-center gap-1 py-2.5 text-xs text-muted-foreground/60"
              }
            >
              <item.icon className="size-5" aria-hidden />
              {item.label}
              {!item.active && <span className="sr-only"> (coming soon)</span>}
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
