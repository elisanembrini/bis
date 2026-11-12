import type { RecipesSearch } from "./queries";
import { type RecipeSort, isMinRatingFilter } from "./rating";

const SEARCH_MAX_LENGTH = 200;

const nonEmpty = (value: unknown): string | undefined =>
  typeof value === "string" && value.trim() !== "" ? value.slice(0, SEARCH_MAX_LENGTH) : undefined;

const minRatingOf = (value: unknown): number | undefined => {
  const number = typeof value === "string" ? Number(value) : value;
  return typeof number === "number" && isMinRatingFilter(number) ? number : undefined;
};

export const validateRecipesSearch = (search: Record<string, unknown>): RecipesSearch => {
  const q = nonEmpty(search["q"]);
  const ingredient = nonEmpty(search["ingredient"]);
  const tag = nonEmpty(search["tag"]);
  const minRating = minRatingOf(search["minRating"]);
  const sort = search["sort"] === "rating" ? "rating" : undefined;
  return {
    ...(q === undefined ? {} : { q }),
    ...(ingredient === undefined ? {} : { ingredient }),
    ...(tag === undefined ? {} : { tag }),
    ...(minRating === undefined ? {} : { minRating }),
    ...(sort === undefined ? {} : { sort }),
  };
};

export const withSearchText = (
  search: RecipesSearch,
  mode: "title" | "ingredient",
  text: string,
): RecipesSearch => {
  const value = text.trim() === "" ? undefined : text;
  return {
    ...(search.tag === undefined ? {} : { tag: search.tag }),
    ...(search.minRating === undefined ? {} : { minRating: search.minRating }),
    ...(search.sort === undefined ? {} : { sort: search.sort }),
    ...(value === undefined ? {} : mode === "title" ? { q: value } : { ingredient: value }),
  };
};

export const withSort = (search: RecipesSearch, sort: RecipeSort | undefined): RecipesSearch => {
  const { sort: _previous, ...rest } = search;
  return sort === undefined ? rest : { ...rest, sort };
};

export const withMinRating = (
  search: RecipesSearch,
  minRating: number | undefined,
): RecipesSearch => {
  const { minRating: _previous, ...rest } = search;
  return minRating === undefined ? rest : { ...rest, minRating };
};

export const hasActiveFilters = ({ q, ingredient, tag, minRating }: RecipesSearch): boolean =>
  [q, ingredient, tag, minRating].some((value) => value !== undefined);
