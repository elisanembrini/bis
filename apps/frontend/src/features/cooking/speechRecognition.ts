export type RecognitionResultEvent = Event & {
  resultIndex: number;
  results: SpeechRecognitionResultList;
};

export type RecognitionErrorEvent = Event & { error: string };

export type Recognition = EventTarget & {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

export const isResultEvent = (event: Event): event is RecognitionResultEvent =>
  "results" in event && "resultIndex" in event;

export const isErrorEvent = (event: Event): event is RecognitionErrorEvent =>
  "error" in event && typeof event.error === "string";

type RecognitionConstructor = new () => Recognition;

const isRecognitionConstructor = (value: unknown): value is RecognitionConstructor =>
  typeof value === "function";

export const getRecognitionConstructor = (): RecognitionConstructor | undefined => {
  const candidate: unknown =
    Reflect.get(window, "SpeechRecognition") ?? Reflect.get(window, "webkitSpeechRecognition");
  return isRecognitionConstructor(candidate) ? candidate : undefined;
};

export const DENIED_ERRORS = new Set(["not-allowed", "service-not-allowed"]);
export const HARMLESS_ERRORS = new Set(["no-speech", "aborted"]);
