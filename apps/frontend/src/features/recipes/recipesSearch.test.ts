import { describe, expect, it } from "vitest";

import {
  hasActiveFilters,
  validateRecipesSearch,
  withMinRating,
  withSearchText,
  withSort,
} from "./recipesSearch";

describe("validateRecipesSearch", () => {
  it("keeps non-empty text parameters", () => {
    expect(validateRecipesSearch({ q: "pasta", tag: "t1" })).toEqual({ q: "pasta", tag: "t1" });
  });

  it("drops empty and non-text parameters", () => {
    expect(validateRecipesSearch({ q: "  ", ingredient: 3, tag: null })).toEqual({});
  });

  it("limits very long text", () => {
    expect(validateRecipesSearch({ q: "a".repeat(500) }).q).toHaveLength(200);
  });
});

describe("withSearchText", () => {
  it("puts the text in the parameter of the chosen mode and keeps the tag", () => {
    expect(withSearchText({ q: "old", tag: "t1" }, "ingredient", "zucchine")).toEqual({
      ingredient: "zucchine",
      tag: "t1",
    });
  });

  it("removes the text when it is cleared", () => {
    expect(withSearchText({ q: "pasta" }, "title", "")).toEqual({});
  });
});

describe("rating parameters", () => {
  it("keeps the offered minimum ratings, also when written as text", () => {
    expect(validateRecipesSearch({ minRating: 7 })).toEqual({ minRating: 7 });
    expect(validateRecipesSearch({ minRating: "9" })).toEqual({ minRating: 9 });
    expect(validateRecipesSearch({ minRating: 10 })).toEqual({ minRating: 10 });
  });

  it("drops minimum ratings that are not offered or not numbers", () => {
    for (const minRating of [0, 3, 11, 7.5, "alto", null, [7]]) {
      expect(validateRecipesSearch({ minRating })).toEqual({});
    }
  });

  it("accepts only the rating sort and treats anything else as the default", () => {
    expect(validateRecipesSearch({ sort: "rating" })).toEqual({ sort: "rating" });
    expect(validateRecipesSearch({ sort: "recent" })).toEqual({});
    expect(validateRecipesSearch({ sort: "alfabetico" })).toEqual({});
  });

  it("keeps the rating parameters when the search text changes", () => {
    expect(
      withSearchText({ q: "old", tag: "t1", minRating: 8, sort: "rating" }, "title", "pasta"),
    ).toEqual({ q: "pasta", tag: "t1", minRating: 8, sort: "rating" });
  });

  it("sets and clears the sort and the minimum rating without touching the rest", () => {
    expect(withSort({ q: "pasta" }, "rating")).toEqual({ q: "pasta", sort: "rating" });
    expect(withSort({ q: "pasta", sort: "rating" }, undefined)).toEqual({ q: "pasta" });
    expect(withMinRating({ sort: "rating" }, 8)).toEqual({ sort: "rating", minRating: 8 });
    expect(withMinRating({ minRating: 8, tag: "t1" }, undefined)).toEqual({ tag: "t1" });
  });
});

describe("hasActiveFilters", () => {
  it("counts text, tag and minimum rating, but not the sort order", () => {
    expect(hasActiveFilters({})).toBe(false);
    expect(hasActiveFilters({ sort: "rating" })).toBe(false);
    expect(hasActiveFilters({ minRating: 7 })).toBe(true);
    expect(hasActiveFilters({ q: "pasta" })).toBe(true);
    expect(hasActiveFilters({ tag: "t1" })).toBe(true);
  });
});
