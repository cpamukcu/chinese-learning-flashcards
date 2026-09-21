export type HskLevel = 1 | 2 | 3 | 4 | 5 | 6;

export type ScenarioId =
  | "free-chat"
  | "ordering-food"
  | "introducing-yourself"
  | "travel"
  | "shopping"
  | "work-small-talk"
  | "job-interview";

export interface TutorCorrection {
  original: string;
  better: string;
  explanation: string;
}

export interface TutorNewWord {
  zh: string;
  pinyin: string;
  en: string;
}

// Shape from spec §6, returned by /api/tutor.
export interface TutorReply {
  reply_zh: string;
  reply_pinyin: string;
  reply_en: string;
  correction: TutorCorrection | null;
  new_words: TutorNewWord[];
}

// One turn of history sent by the client. Tutor turns carry only their spoken
// Chinese; the server never trusts the client for anything else.
export interface ChatTurn {
  role: "user" | "tutor";
  text: string;
}

export interface TutorRequest {
  messages: ChatTurn[];
  scenario: ScenarioId;
  level: HskLevel;
}
