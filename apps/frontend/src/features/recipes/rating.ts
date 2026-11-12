export const RATING_MIN = 1;
export const RATING_MAX = 10;

export const RATINGS: readonly number[] = Array.from(
  { length: RATING_MAX - RATING_MIN + 1 },
  (_, index) => RATING_MIN + index,
);

export const MIN_RATING_FILTERS = [6, 7, 8, 9, 10] as const;

export type RecipeSort = "rating";

export const isMinRatingFilter = (value: number): boolean =>
  MIN_RATING_FILTERS.some((option) => option === value);
