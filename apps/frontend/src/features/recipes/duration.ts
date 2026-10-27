export type DurationParts = { hours: number; minutes: number; seconds: number };

export const durationParts = (totalSeconds: number): DurationParts => ({
  hours: Math.floor(totalSeconds / 3600),
  minutes: Math.floor((totalSeconds % 3600) / 60),
  seconds: totalSeconds % 60,
});

export const splitTimer = (totalSeconds: number | null): { minutes: string; seconds: string } => {
  if (totalSeconds === null) {
    return { minutes: "", seconds: "" };
  }
  return {
    minutes: String(Math.floor(totalSeconds / 60)),
    seconds: String(totalSeconds % 60),
  };
};

export const joinTimer = (minutes: string, seconds: string): number | null => {
  const total = toWholeNumber(minutes) * 60 + toWholeNumber(seconds);
  return total > 0 ? total : null;
};

const toWholeNumber = (value: string): number => {
  const trimmed = value.trim();
  return /^\d+$/.test(trimmed) ? Number(trimmed) : 0;
};
