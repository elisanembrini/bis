import { describe, expect, it } from "vitest";

import { formatQuantity, parseQuantity, quantityToInput } from "./quantity";

describe("parseQuantity", () => {
  it.each([
    ["1,5", "1.5"],
    ["1.5", "1.5"],
    ["200", "200"],
    ["0,25", "0.25"],
    [" 2,500 ", "2.5"],
    ["007", "7"],
    ["0,125", "0.125"],
  ])("reads %j as %j", (input, expected) => {
    expect(parseQuantity(input)).toEqual({ ok: true, value: expected });
  });

  it("treats an empty quantity as q.b.", () => {
    expect(parseQuantity("")).toEqual({ ok: true, value: null });
    expect(parseQuantity("   ")).toEqual({ ok: true, value: null });
  });

  it.each(["0", "0,0", "-1", "1,2345", "1.000,5", "1,5,2", "abc", "1/2", ",5", "1,"])(
    "rejects %j",
    (input) => {
      expect(parseQuantity(input)).toEqual({ ok: false });
    },
  );
});

describe("formatQuantity", () => {
  it.each([
    ["1.500", "1,5"],
    ["200.000", "200"],
    ["0.125", "0,125"],
    ["320", "320"],
    ["2.50", "2,5"],
  ])("shows %j as %j", (value, expected) => {
    expect(formatQuantity(value)).toBe(expected);
  });
});

describe("quantityToInput", () => {
  it("leaves the field empty for q.b.", () => {
    expect(quantityToInput(null)).toBe("");
  });

  it("uses the Italian decimal comma", () => {
    expect(quantityToInput("1.500")).toBe("1,5");
  });
});
