import { describe, expect, it } from "vitest";

import { decimalSeparator } from "./numbers";

describe("decimalSeparator", () => {
  it.each([
    ["it", ","],
    ["en", "."],
    ["de", ","],
    ["fr", ","],
  ])("is %j for %s", (language, expected) => {
    expect(decimalSeparator(language)).toBe(expected);
  });
});
