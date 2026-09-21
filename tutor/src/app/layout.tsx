import type { Metadata, Viewport } from "next";
// Fonts are bundled from npm (not fetched from Google at build/run time), so
// the app works offline and where Google Fonts is slow or blocked. Noto Sans SC
// is split into unicode-range slices: browsers only download glyphs in use.
import "@fontsource-variable/dm-sans";
import "@fontsource-variable/noto-sans-sc";
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
