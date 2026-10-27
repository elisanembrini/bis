import type { RecipesSearch } from "./queries";

const SEARCH_MAX_LENGTH = 200;

const nonEmpty = (value: unknown): string | undefined =>
  typeof value === "string" && value.trim() !== "" ? value.slice(0, SEARCH_MAX_LENGTH) : undefined;

export const validateRecipesSearch = (search: Record<string, unknown>): RecipesSearch => {
  const q = nonEmpty(search["q"]);
  const ingredient = nonEmpty(search["ingredient"]);
  const tag = nonEmpty(search["tag"]);
  return {
    ...(q === undefined ? {} : { q }),
    ...(ingredient === undefined ? {} : { ingredient }),
    ...(tag === undefined ? {} : { tag }),
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
    ...(value === undefined ? {} : mode === "title" ? { q: value } : { ingredient: value }),
  };
};
