// Thrown by a provider when it can't answer for a reason the learner or
// developer can act on (missing key, Ollama not running, no credit…).
// `message` is safe to show in the UI.
export class TutorProviderError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly status: number = 503,
  ) {
    super(message);
    this.name = "TutorProviderError";
  }
}

export class TutorRefusalError extends Error {
  constructor() {
    super("The tutor declined to answer this message.");
    this.name = "TutorRefusalError";
  }
}
