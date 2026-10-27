import type { Unit } from "./types";

export const SERVINGS_MIN = 1;
export const SERVINGS_MAX = 100;

const stepFor = (unit: Unit | null, value: number): number => {
  switch (unit) {
    case "g":
    case "ml":
      if (value < 10) {
        return 0.1;
      }
      if (value < 100) {
        return 1;
      }
      return value < 1000 ? 5 : 10;
    case "kg":
    case "l":
      return value < 1 ? 0.05 : 0.1;
    case "cucchiaio":
    case "cucchiaino":
    case "tazza":
      return 0.25;
    case "pizzico":
      return 1;
    default:
      return value < 10 ? 0.5 : 1;
  }
};

const decimalsOf = (step: number): number => {
  const [, decimals = ""] = String(step).split(".");
  return decimals.length;
};

export const scaleQuantity = (
  quantity: string | null,
  unit: Unit | null,
  fromServings: number,
  toServings: number,
): string | null => {
  if (quantity === null || fromServings === toServings) {
    return quantity;
  }
  const scaled = (Number(quantity) * toServings) / fromServings;
  const step = stepFor(unit, scaled);
  const rounded = Math.max(step, Math.round(scaled / step) * step);
  return rounded.toFixed(decimalsOf(step));
};
