import type { RecipeResponse, RecipeSummary } from "../types";

export const pastaRecipe: RecipeResponse = {
  id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  title: "Pasta al pomodoro",
  notes: "Meglio con il basilico fresco.\nSe avanza, il giorno dopo è ancora più buona.",
  prep_minutes: 10,
  cook_minutes: 15,
  servings: 4,
  created_at: "2026-10-20T18:00:00Z",
  updated_at: "2026-10-20T18:00:00Z",
  ingredients: [
    { id: "i1", quantity: "320.000", unit: "g", name: "spaghetti" },
    { id: "i2", quantity: "1.500", unit: "cucchiaio", name: "olio extravergine" },
    { id: "i3", quantity: "1.000", unit: "spicchio", name: "aglio" },
    { id: "i4", quantity: null, unit: null, name: "sale" },
  ],
  steps: [
    { id: "s1", text: "Porta a bollore l'acqua e sala.", timer_seconds: null },
    { id: "s2", text: "Cuoci la pasta.", timer_seconds: 570 },
    { id: "s3", text: "Condisci con il sugo.", timer_seconds: null },
  ],
};

export const minimalRecipe: RecipeResponse = {
  ...pastaRecipe,
  id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  title: "Uovo sodo",
  notes: null,
  prep_minutes: null,
  cook_minutes: null,
  servings: 1,
  ingredients: [{ id: "i5", quantity: null, unit: null, name: "uovo" }],
  steps: [{ id: "s4", text: "Cuoci in acqua bollente.", timer_seconds: 540 }],
};

export const recipeSummaries: RecipeSummary[] = [pastaRecipe, minimalRecipe].map(
  ({ id, title, servings, prep_minutes, cook_minutes, created_at, updated_at }) => ({
    id,
    title,
    servings,
    prep_minutes,
    cook_minutes,
    created_at,
    updated_at,
  }),
);
