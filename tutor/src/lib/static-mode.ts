// True in the static GitHub Pages build (scripts/build-static.mjs). There is no
// server in that edition: no login, no /api routes. The chat runs in the
// visitor's browser and calls the model provider directly.
// NEXT_PUBLIC_ variables are inlined at build time, so dead branches disappear.
export const IS_STATIC = process.env.NEXT_PUBLIC_STATIC_EXPORT === "1";
