import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { type CookingTimer, timerId } from "./timers";

type TimersState = {
  timers: Record<string, CookingTimer>;
  start: (recipeId: string, stepIndex: number, durationMs: number) => void;
  finish: (ids: string[]) => void;
  dismiss: (id: string) => void;
  cancel: (id: string) => void;
  clearRecipe: (recipeId: string) => void;
};

const withoutKeys = (
  timers: Record<string, CookingTimer>,
  shouldRemove: (timer: CookingTimer) => boolean,
): Record<string, CookingTimer> =>
  Object.fromEntries(Object.entries(timers).filter(([, timer]) => !shouldRemove(timer)));

export const useTimersStore = create<TimersState>()(
  persist(
    (set) => ({
      timers: {},
      start: (recipeId, stepIndex, durationMs) =>
        set((state) => {
          const id = timerId(recipeId, stepIndex);
          if (state.timers[id]?.status === "running") {
            return state;
          }
          const timer: CookingTimer = {
            id,
            recipeId,
            stepIndex,
            durationMs,
            endsAt: Date.now() + durationMs,
            status: "running",
          };
          return { timers: { ...state.timers, [id]: timer } };
        }),
      finish: (ids) =>
        set((state) => ({
          timers: Object.fromEntries(
            Object.entries(state.timers).map(([id, timer]) => [
              id,
              ids.includes(id) ? { ...timer, status: "finished" as const } : timer,
            ]),
          ),
        })),
      dismiss: (id) =>
        set((state) => ({ timers: withoutKeys(state.timers, (timer) => timer.id === id) })),
      cancel: (id) =>
        set((state) => ({ timers: withoutKeys(state.timers, (timer) => timer.id === id) })),
      clearRecipe: (recipeId) =>
        set((state) => ({
          timers: withoutKeys(state.timers, (timer) => timer.recipeId === recipeId),
        })),
    }),
    {
      name: "bis:cooking-timers",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({ timers: state.timers }),
    },
  ),
);

export const timersOfRecipe = (
  timers: Record<string, CookingTimer>,
  recipeId: string,
): CookingTimer[] =>
  Object.values(timers)
    .filter((timer) => timer.recipeId === recipeId)
    .toSorted((left, right) => left.endsAt - right.endsAt);
