// Model and limits for the tutor. Change the model here only.
// claude-sonnet-5 is the cheaper option if cost matters more than nuance.
export const TUTOR_MODEL = "claude-opus-5";

// Adaptive thinking spends output tokens too, so leave headroom above the
// ~150 tokens a reply needs.
export const TUTOR_MAX_TOKENS = 2048;

export const LIMITS = {
  maxMessageChars: 500,
  maxHistoryTurns: 20,
} as const;
