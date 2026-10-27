import { SERVINGS_MAX, SERVINGS_MIN } from "../recipes/servings";

export type CookSearch = { step?: number; servings?: number };

const wholeNumber = (value: unknown): number | undefined => {
  const parsed = typeof value === "string" ? Number(value) : value;
  return typeof parsed === "number" && Number.isInteger(parsed) ? parsed : undefined;
};

export const validateServingsSearch = (search: Record<string, unknown>): { servings?: number } => {
  const servings = wholeNumber(search["servings"]);
  return servings !== undefined && servings >= SERVINGS_MIN && servings <= SERVINGS_MAX
    ? { servings }
    : {};
};

export const validateCookSearch = (search: Record<string, unknown>): CookSearch => {
  const step = wholeNumber(search["step"]);
  return {
    ...validateServingsSearch(search),
    ...(step !== undefined && step >= 1 ? { step } : {}),
  };
};

export const clampStep = (step: number | undefined, stepCount: number): number =>
  Math.min(Math.max(step ?? 1, 1), Math.max(stepCount, 1));
