import type { CookingTimer } from "../timers";

export const NOW = new Date("2026-10-27T18:00:00Z").getTime();

export const runningTimer: CookingTimer = {
  id: "r1:1",
  recipeId: "r1",
  stepIndex: 1,
  durationMs: 300_000,
  endsAt: NOW + 221_000,
  status: "running",
};

export const longTimer: CookingTimer = {
  id: "r1:2",
  recipeId: "r1",
  stepIndex: 2,
  durationMs: 2_700_000,
  endsAt: NOW + 2_580_000,
  status: "running",
};

export const finishedTimer: CookingTimer = {
  id: "r1:0",
  recipeId: "r1",
  stepIndex: 0,
  durationMs: 60_000,
  endsAt: NOW - 5_000,
  status: "finished",
};
