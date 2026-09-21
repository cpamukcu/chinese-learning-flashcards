import type { NextConfig } from "next";

// Normal build: a Node server (login, /api routes).
// STATIC_EXPORT=1 (scripts/build-static.mjs): plain files for GitHub Pages.
const isStatic = process.env.STATIC_EXPORT === "1";

const nextConfig: NextConfig = isStatic
  ? {
      output: "export",
      // Project pages live under /<repo>/, so every URL needs this prefix.
      basePath: process.env.STATIC_BASE_PATH ?? "",
      trailingSlash: true,
      images: { unoptimized: true },
      // The build script works in a copy of the source; resolve packages from
      // the real project folder.
      ...(process.env.STATIC_TURBOPACK_ROOT
        ? { turbopack: { root: process.env.STATIC_TURBOPACK_ROOT } }
        : {}),
    }
  : {};

export default nextConfig;
