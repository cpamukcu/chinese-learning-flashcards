import type { Metadata, Viewport } from "next";
// Latin font bundled from npm (not fetched from Google), so it works offline and
// where Google Fonts is blocked. Chinese uses the device's own font (see
// globals.css): downloading a Chinese web font cost ~340 KB per page.
import "@fontsource-variable/dm-sans";
import { site } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: `${site.name} ${site.nameLatin} — ${site.tagline}`,
    template: `%s · ${site.name} ${site.nameLatin}`,
  },
  description: site.description,
};

export const viewport: Viewport = {
  themeColor: "#fbf7f0",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
