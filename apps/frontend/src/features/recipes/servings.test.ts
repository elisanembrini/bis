import { describe, expect, it } from "vitest";

import { formatQuantity } from "./quantity";
import { scaleQuantity } from "./servings";
import type { Unit } from "./types";

const scaled = (quantity: string, unit: Unit | null, from: number, to: number) => {
  const result = scaleQuantity(quantity, unit, from, to);
  return result === null ? null : formatQuantity(result);
};

describe("scaleQuantity", () => {
  it("halves quantities going from 4 to 2 servings", () => {
    expect(scaled("300", "g", 4, 2)).toBe("150");
    expect(scaled("4", null, 4, 2)).toBe("2");
    expect(scaled("2", "cucchiaio", 4, 2)).toBe("1");
  });

  it("never changes q.b. ingredients", () => {
    expect(scaleQuantity(null, null, 4, 2)).toBeNull();
    expect(scaleQuantity(null, "g", 4, 7)).toBeNull();
  });

  it("keeps the saved quantity untouched when servings do not change", () => {
    expect(scaleQuantity("333.333", "g", 4, 4)).toBe("333.333");
  });

  it.each([
    ["7.5", 1, 1, "7,5"],
    ["10", 4, 3, "7,5"],
    ["100", 3, 1, "33"],
    ["200", 3, 5, "335"],
    ["1000", 4, 5, "1250"],
    ["1000", 3, 4, "1330"],
    ["0.3", 1, 3, "0,9"],
  ])(
    "rounds grams and millilitres readably: %s from %s to %s servings = %s",
    (quantity, from, to, expected) => {
      expect(scaled(quantity, "g", from, to)).toBe(expected);
      expect(scaled(quantity, "ml", from, to)).toBe(expected);
    },
  );

  it.each([
    ["1", 3, 1, "0,35"],
    ["0.5", 4, 3, "0,4"],
    ["1", 3, 4, "1,3"],
    ["1.5", 2, 3, "2,3"],
  ])("rounds kilos and litres: %s from %s to %s servings = %s", (quantity, from, to, expected) => {
    expect(scaled(quantity, "kg", from, to)).toBe(expected);
    expect(scaled(quantity, "l", from, to)).toBe(expected);
  });

  it("rounds spoons and cups to quarters", () => {
    expect(scaled("1", "cucchiaio", 4, 5)).toBe("1,25");
    expect(scaled("1", "cucchiaino", 3, 1)).toBe("0,25");
    expect(scaled("1", "tazza", 4, 2)).toBe("0,5");
    expect(scaled("1", "tazza", 8, 1)).toBe("0,25");
  });

  it("rounds pieces, cloves and countable ingredients to halves, then to whole numbers", () => {
    expect(scaled("3", "pezzi", 4, 2)).toBe("1,5");
    expect(scaled("1", "spicchio", 4, 1)).toBe("0,5");
    expect(scaled("2", null, 4, 3)).toBe("1,5");
    expect(scaled("4", null, 4, 11)).toBe("11");
    expect(scaled("3", "pezzi", 4, 15)).toBe("11");
  });

  it("rounds pinches to whole numbers and keeps at least one", () => {
    expect(scaled("1", "pizzico", 4, 2)).toBe("1");
    expect(scaled("1", "pizzico", 2, 5)).toBe("3");
  });

  it("never rounds down to zero", () => {
    expect(scaled("1", "g", 100, 1)).toBe("0,1");
    expect(scaled("1", "pezzi", 100, 1)).toBe("0,5");
    expect(scaled("0.1", "kg", 10, 1)).toBe("0,05");
  });
});
