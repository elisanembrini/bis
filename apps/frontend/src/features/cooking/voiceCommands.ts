export type VoiceCommand = "next" | "previous" | "repeat" | "startTimer";

const COMMANDS: readonly VoiceCommand[] = ["next", "previous", "repeat", "startTimer"];

const PHRASES: Record<VoiceCommand, readonly string[]> = {
  next: ["avanti", "vai avanti", "prossimo", "successivo", "continua"],
  previous: ["indietro", "torna indietro", "precedente"],
  repeat: ["ripeti", "rileggi", "ancora", "di nuovo"],
  startTimer: ["avvia timer", "avvia il timer", "fai partire il timer", "inizia il timer", "parti"],
};

export const normalizeTranscript = (transcript: string): string =>
  transcript
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^\p{Letter}\p{Number}]+/gu, " ")
    .trim();

export const parseCommand = (transcript: string): VoiceCommand | null => {
  const text = ` ${normalizeTranscript(transcript)} `;
  let found: { command: VoiceCommand; end: number } | null = null;
  for (const command of COMMANDS) {
    for (const phrase of PHRASES[command]) {
      const position = text.lastIndexOf(` ${phrase} `);
      if (position === -1) {
        continue;
      }
      const end = position + phrase.length;
      if (found === null || end > found.end) {
        found = { command, end };
      }
    }
  }
  return found?.command ?? null;
};
