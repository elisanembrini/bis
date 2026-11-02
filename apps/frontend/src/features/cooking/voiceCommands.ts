export type VoiceCommand = "next" | "previous" | "repeat" | "startTimer";

export type VoicePhrases = Record<VoiceCommand, readonly string[]>;

const COMMANDS: readonly VoiceCommand[] = ["next", "previous", "repeat", "startTimer"];

export const normalizeTranscript = (transcript: string): string =>
  transcript
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^\p{Letter}\p{Number}]+/gu, " ")
    .trim();

export const parseCommand = (transcript: string, phrases: VoicePhrases): VoiceCommand | null => {
  const text = ` ${normalizeTranscript(transcript)} `;
  let found: { command: VoiceCommand; end: number } | null = null;
  for (const command of COMMANDS) {
    for (const phrase of phrases[command]) {
      const normalized = normalizeTranscript(phrase);
      if (normalized === "") {
        continue;
      }
      const position = text.lastIndexOf(` ${normalized} `);
      if (position === -1) {
        continue;
      }
      const end = position + normalized.length;
      if (found === null || end > found.end) {
        found = { command, end };
      }
    }
  }
  return found?.command ?? null;
};
