import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { dueTimers, formatClock, remainingMs, timerId } from "./timers";
import { timersOfRecipe, useTimersStore } from "./timersStore";

const START = new Date("2026-10-27T18:00:00Z");
const MINUTE = 60_000;

const state = () => useTimersStore.getState();
const timer = (recipeId: string, stepIndex: number) => {
  const found = state().timers[timerId(recipeId, stepIndex)];
  if (found === undefined) {
    throw new Error("timer not found");
  }
  return found;
};

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(START);
  useTimersStore.setState({ timers: {} });
  window.sessionStorage.clear();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("cooking timers", () => {
  it("computes the remaining time from the end time", () => {
    state().start("r1", 0, 5 * MINUTE);

    vi.advanceTimersByTime(90_000);

    expect(remainingMs(timer("r1", 0), Date.now())).toBe(210_000);
  });

  it("stays exact after a long time in background", () => {
    state().start("r1", 0, 5 * MINUTE);

    vi.setSystemTime(new Date(START.getTime() + 3 * MINUTE + 1_500));

    expect(formatClock(remainingMs(timer("r1", 0), Date.now()))).toBe("1:59");
  });

  it("runs several timers at the same time", () => {
    state().start("r1", 0, 10 * MINUTE);
    vi.advanceTimersByTime(MINUTE);
    state().start("r1", 2, 2 * MINUTE);

    const ordered = timersOfRecipe(state().timers, "r1");

    expect(ordered.map((item) => item.stepIndex)).toEqual([2, 0]);
    expect(ordered.map((item) => remainingMs(item, Date.now()))).toEqual([2 * MINUTE, 9 * MINUTE]);
  });

  it("detects finished timers and lets the user dismiss them", () => {
    state().start("r1", 0, MINUTE);
    state().start("r1", 1, 3 * MINUTE);

    vi.advanceTimersByTime(MINUTE);
    const due = dueTimers(Object.values(state().timers), Date.now());
    state().finish(due.map((item) => item.id));

    expect(due.map((item) => item.stepIndex)).toEqual([0]);
    expect(timer("r1", 0).status).toBe("finished");
    expect(timer("r1", 1).status).toBe("running");
    expect(dueTimers(Object.values(state().timers), Date.now())).toEqual([]);

    state().dismiss(timerId("r1", 0));
    expect(state().timers[timerId("r1", 0)]).toBeUndefined();
  });

  it("does not restart a timer that is already running", () => {
    state().start("r1", 0, 5 * MINUTE);
    vi.advanceTimersByTime(MINUTE);

    state().start("r1", 0, 5 * MINUTE);

    expect(remainingMs(timer("r1", 0), Date.now())).toBe(4 * MINUTE);
  });

  it("restarts a finished timer", () => {
    state().start("r1", 0, MINUTE);
    vi.advanceTimersByTime(MINUTE);
    state().finish([timerId("r1", 0)]);

    state().start("r1", 0, MINUTE);

    expect(timer("r1", 0).status).toBe("running");
    expect(remainingMs(timer("r1", 0), Date.now())).toBe(MINUTE);
  });

  it("cancels one timer or all the timers of a recipe", () => {
    state().start("r1", 0, MINUTE);
    state().start("r1", 1, MINUTE);
    state().start("r2", 0, MINUTE);

    state().cancel(timerId("r1", 1));
    expect(Object.keys(state().timers).toSorted()).toEqual(["r1:0", "r2:0"]);

    state().clearRecipe("r1");
    expect(Object.keys(state().timers)).toEqual(["r2:0"]);
  });

  it("keeps timers in session storage", () => {
    state().start("r1", 0, MINUTE);

    expect(window.sessionStorage.getItem("bis:cooking-timers")).toContain('"r1:0"');
  });
});

describe("formatClock", () => {
  it.each([
    [0, "0:00"],
    [999, "0:01"],
    [61_000, "1:01"],
    [600_000, "10:00"],
    [3_723_000, "1:02:03"],
    [-5_000, "0:00"],
  ])("shows %i ms as %s", (milliseconds, expected) => {
    expect(formatClock(milliseconds)).toBe(expected);
  });
});
