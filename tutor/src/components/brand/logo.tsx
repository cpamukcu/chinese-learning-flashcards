import Link from "next/link";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils";

// Vermilion "seal" (印章) with the working name beside it.
export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn("flex items-center gap-2.5 font-semibold", className)}
      aria-label={`${site.name} ${site.nameLatin} home`}
    >
      <span
        aria-hidden
        className="font-zh grid size-9 place-items-center rounded-lg bg-primary text-lg font-bold text-primary-foreground shadow-sm"
      >
        说
      </span>
      <span className="text-lg tracking-tight">{site.nameLatin}</span>
    </Link>
  );
}
