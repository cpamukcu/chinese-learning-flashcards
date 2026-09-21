import "server-only";

// The only place server-side secrets are read. `server-only` makes the build
// fail if a client component ever imports this module.
// Getters are lazy so the app can run with only some keys configured.

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable ${name}. See .env.example.`);
  }
  return value;
}

export const serverEnv = {
  get anthropicApiKey() {
    return required("ANTHROPIC_API_KEY");
  },
  get sttApiKey() {
    return required("STT_API_KEY");
  },
  get ttsApiKey() {
    return required("TTS_API_KEY");
  },
  get supabaseServiceRoleKey() {
    return required("SUPABASE_SERVICE_ROLE_KEY");
  },
};
