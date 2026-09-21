// Builds the static edition of the tutor for GitHub Pages and writes it to
// <repo root>/app/, served at https://<user>.github.io/<repo>/app/.
//
// The normal app needs a Node server (login, /api routes). GitHub Pages only
// serves files, so this builds a copy of the source with the server-only parts
// removed. Your real source is never modified.
//
//   npm run build:static        (from tutor/ or from the repo root)
//
// Then commit the changed app/ folder and push.

import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const tutorDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = path.resolve(tutorDir, "..");
const workDir = path.join(tutorDir, ".static-build");
const outputDir = path.join(repoRoot, "app");
const repoName = process.env.PAGES_REPO ?? "chinese-learning-flashcards";
const basePath = `/${repoName}/app`;

// Server-only code that cannot exist in a static export.
const REMOVE = [
  "src/proxy.ts", // request-time redirects
  "src/app/api", // /api/tutor
  "src/app/auth", // sign-in callbacks
  "src/app/(auth)", // login page
];

console.log("Preparing a copy of the source...");
rmSync(workDir, { recursive: true, force: true });
mkdirSync(workDir, { recursive: true });
for (const item of ["package.json", "tsconfig.json", "postcss.config.mjs", "next.config.ts", "src", "public"]) {
  cpSync(path.join(tutorDir, item), path.join(workDir, item), { recursive: true });
}
for (const item of REMOVE) rmSync(path.join(workDir, item), { recursive: true, force: true });

console.log(`Building static site for ${basePath}/ ...`);
const nextBin = path.join(tutorDir, "node_modules/next/dist/bin/next");
const result = spawnSync(process.execPath, [nextBin, "build"], {
  cwd: workDir,
  stdio: "inherit",
  env: {
    ...process.env,
    STATIC_EXPORT: "1",
    NEXT_PUBLIC_STATIC_EXPORT: "1",
    STATIC_BASE_PATH: basePath,
    // The copy resolves node_modules from the real project folder.
    STATIC_TURBOPACK_ROOT: tutorDir,
    NEXT_TELEMETRY_DISABLED: "1",
  },
});
if (result.status !== 0) {
  console.error("\nStatic build failed. Nothing was published.");
  process.exit(result.status ?? 1);
}

const built = path.join(workDir, "out");
if (!existsSync(path.join(built, "index.html"))) {
  console.error("Build finished but out/index.html is missing. Nothing was published.");
  process.exit(1);
}

rmSync(outputDir, { recursive: true, force: true });
cpSync(built, outputDir, { recursive: true });
// GitHub Pages runs Jekyll by default, which ignores folders starting with "_"
// (like _next). This empty file switches that off.
writeFileSync(path.join(repoRoot, ".nojekyll"), "");
rmSync(workDir, { recursive: true, force: true });

function sizeOf(dir) {
  return readdirSync(dir, { withFileTypes: true }).reduce((total, entry) => {
    const full = path.join(dir, entry.name);
    return total + (entry.isDirectory() ? sizeOf(full) : statSync(full).size);
  }, 0);
}
console.log(`\nDone: ${path.relative(repoRoot, outputDir)}/ (${(sizeOf(outputDir) / 1024).toFixed(0)} KB on disk)`);
console.log(`After you commit and push, it will be live at https://<your-user>.github.io${basePath}/`);
