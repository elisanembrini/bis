import { describe, expect, it } from "vitest";

import { validateRecipesSearch, withSearchText } from "./recipesSearch";

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
