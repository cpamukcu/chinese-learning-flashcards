import { Logo } from "@/components/brand/logo";
import { site } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:px-6">
        <Logo />
        <p>
          © {new Date().getFullYear()} {site.name} {site.nameLatin}. Beta.
        </p>
      </div>
    </footer>
  );
}
