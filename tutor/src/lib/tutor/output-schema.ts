// JSON Schema for structured output. Pinyin is not requested from the model;
// parse.ts fills it in locally (pinyin-pro).
export const TUTOR_OUTPUT_SCHEMA = {
  type: "object",
  properties: {
    reply_zh: { type: "string" },
    reply_en: { type: "string" },
    correction: {
      anyOf: [
        { type: "null" },
        {
          type: "object",
          properties: {
            original: { type: "string" },
            better: { type: "string" },
            explanation: { type: "string" },
          },
          required: ["original", "better", "explanation"],
          additionalProperties: false,
        },
      ],
    },
    new_words: {
      type: "array",
      items: {
        type: "object",
        properties: {
          zh: { type: "string" },
          en: { type: "string" },
        },
        required: ["zh", "en"],
        additionalProperties: false,
      },
    },
  },
  required: ["reply_zh", "reply_en", "correction", "new_words"],
  additionalProperties: false,
} as const;
