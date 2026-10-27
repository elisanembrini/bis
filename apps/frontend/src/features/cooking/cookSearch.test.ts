import { describe, expect, it } from "vitest";

import { clampStep, validateCookSearch, validateServingsSearch } from "./cookSearch";

describe("validateCookSearch", () => {
  it("keeps valid step and servings", () => {
    expect(validateCookSearch({ step: 2, servings: 6 })).toEqual({ step: 2, servings: 6 });
    expect(validateCookSearch({ step: "3", servings: "4" })).toEqual({ step: 3, servings: 4 });
  });

  it("drops invalid values", () => {
    expect(validateCookSearch({ step: 0, servings: 101 })).toEqual({});
    expect(validateCookSearch({ step: 1.5, servings: "tante" })).toEqual({});
  });
});

describe("validateServingsSearch", () => {
  it("accepts servings between 1 and 100", () => {
    expect(validateServingsSearch({ servings: 1 })).toEqual({ servings: 1 });
    expect(validateServingsSearch({ servings: 0 })).toEqual({});
  });
});

describe("clampStep", () => {
  it("keeps the step within the recipe", () => {
    expect(clampStep(undefined, 3)).toBe(1);
    expect(clampStep(2, 3)).toBe(2);
    expect(clampStep(9, 3)).toBe(3);
  });
});
