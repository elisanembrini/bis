import type { components } from "../../api/generated/schema";

export type RecipeInput = components["schemas"]["RecipeInput"];
export type RecipeResponse = components["schemas"]["RecipeResponse"];
export type RecipeSummary = components["schemas"]["RecipeSummary"];
export type IngredientResponse = components["schemas"]["IngredientResponse"];
export type StepResponse = components["schemas"]["StepResponse"];
export type Unit = components["schemas"]["Unit"];
export type TagSummary = components["schemas"]["TagSummary"];
export type ShareCandidate = components["schemas"]["ShareCandidate"];
export type TagResponse = components["schemas"]["TagResponse"];

const unitList = [
  "g",
  "kg",
  "ml",
  "l",
  "cucchiaio",
  "cucchiaino",
  "tazza",
  "pizzico",
  "spicchio",
  "pezzi",
] as const satisfies readonly Unit[];

type Exhaustive<T extends readonly Unit[]> = Exclude<Unit, T[number]> extends never ? T : never;

export const UNITS: Exhaustive<typeof unitList> = unitList;

export const isUnit = (value: string): value is Unit => UNITS.some((unit) => unit === value);
