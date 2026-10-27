export type TimerStatus = "running" | "finished";

export type CookingTimer = {
  id: string;
  recipeId: string;
  stepIndex: number;
  durationMs: number;
  endsAt: number;
  status: TimerStatus;
};

export const timerId = (recipeId: string, stepIndex: number): string => `${recipeId}:${stepIndex}`;

export const remainingMs = (timer: CookingTimer, now: number): number =>
  Math.max(0, timer.endsAt - now);

export const dueTimers = (timers: CookingTimer[], now: number): CookingTimer[] =>
  timers.filter((timer) => timer.status === "running" && timer.endsAt <= now);

export const formatClock = (milliseconds: number): string => {
  const totalSeconds = Math.ceil(Math.max(0, milliseconds) / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const paddedSeconds = String(seconds).padStart(2, "0");
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${paddedSeconds}`;
  }
  return `${minutes}:${paddedSeconds}`;
};
