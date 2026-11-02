import { describe, expect, it } from "vitest";

import {
  type RecipeFormValues,
  emptyRecipeForm,
  formToRecipeInput,
  recipeToForm,
  validateRecipeForm,
} from "./form";
import type { RecipeResponse } from "./types";

let counter = 0;
const newKey = () => {
  counter += 1;
  return `key-${counter}`;
};

const validForm = (): RecipeFormValues => ({
  title: "  Pasta al pomodoro ",
  notes: "",
  prepMinutes: "10",
  cookMinutes: "",
  servings: "4",
  coverPhotoId: null,
  tagIds: ["t1"],
  ingredients: [
    { key: "a", quantity: "1,5", unit: "tablespoon", name: " olio " },
    { key: "b", quantity: "", unit: "", name: "sale" },
  ],
  steps: [
    { key: "c", text: "Cuoci la pasta.", timerMinutes: "9", timerSeconds: "30", photoId: null },
    { key: "d", text: "Condisci.", timerMinutes: "", timerSeconds: "", photoId: null },
  ],
});

describe("validateRecipeForm", () => {
  it("accepts a complete recipe", () => {
    expect(validateRecipeForm(validForm())).toEqual({});
  });

  it("requires title, one ingredient, one step and positive servings", () => {
    const errors = validateRecipeForm({
      ...validForm(),
      title: " ",
      servings: "0",
      ingredients: [],
      steps: [],
    });

    expect(errors).toEqual({
      title: "titleRequired",
      servings: "servingsInvalid",
      ingredients: "ingredientsRequired",
      steps: "stepsRequired",
    });
  });

  it("flags invalid rows by position", () => {
    const form = validForm();
    const errors = validateRecipeForm({
      ...form,
      ingredients: [{ key: "a", quantity: "1,2345", unit: "g", name: "" }],
      steps: [{ key: "c", text: "", timerMinutes: "1", timerSeconds: "75", photoId: null }],
    });

    expect(errors).toEqual({
      "ingredients.0.name": "ingredientNameRequired",
      "ingredients.0.quantity": "quantityInvalid",
      "steps.0.text": "stepTextRequired",
      "steps.0.timerSeconds": "timerSecondsInvalid",
    });
  });

  it("rejects timers longer than a day", () => {
    const errors = validateRecipeForm({
      ...validForm(),
      steps: [{ key: "c", text: "Lievita", timerMinutes: "1441", timerSeconds: "", photoId: null }],
    });

    expect(errors).toEqual({ "steps.0.timerMinutes": "timerTooLong" });
  });
});

describe("formToRecipeInput", () => {
  it("converts Italian quantities, timers and empty fields", () => {
    expect(formToRecipeInput(validForm())).toEqual({
      title: "Pasta al pomodoro",
      notes: null,
      prep_minutes: 10,
      cook_minutes: null,
      servings: 4,
      cover_photo_id: null,
      tag_ids: ["t1"],
      ingredients: [
        { quantity: "1.5", unit: "tablespoon", name: "olio" },
        { quantity: null, unit: null, name: "sale" },
      ],
      steps: [
        { text: "Cuoci la pasta.", timer_seconds: 570, photo_id: null },
        { text: "Condisci.", timer_seconds: null, photo_id: null },
      ],
    });
  });
});

describe("recipeToForm", () => {
  it("prepares a saved recipe for editing", () => {
    const recipe: RecipeResponse = {
      id: "r1",
      title: "Pasta",
      is_own: true,
      author: { id: "u1", display_name: "Anna" },
      notes: null,
      prep_minutes: null,
      cook_minutes: 15,
      servings: 2,
      cover_photo_id: "p1",
      tags: [{ id: "t2", name: "Dolci" }],
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
      ingredients: [{ id: "i1", quantity: "1.500", unit: "kg", name: "farina" }],
      steps: [{ id: "s1", text: "Impasta", timer_seconds: 90, photo_id: "p2" }],
    };

    const form = recipeToForm(recipe);

    expect(form.ingredients[0]).toEqual({ key: "i1", quantity: "1,5", unit: "kg", name: "farina" });
    expect(form.coverPhotoId).toBe("p1");
    expect(form.tagIds).toEqual(["t2"]);
    expect(form.steps[0]).toEqual({
      key: "s1",
      text: "Impasta",
      timerMinutes: "1",
      timerSeconds: "30",
      photoId: "p2",
    });
    const input = formToRecipeInput(form);
    expect(input.ingredients[0]?.quantity).toBe("1.5");
    expect(input.cover_photo_id).toBe("p1");
    expect(input.steps[0]?.photo_id).toBe("p2");
  });
});

describe("emptyRecipeForm", () => {
  it("starts with one empty ingredient and one empty step", () => {
    const form = emptyRecipeForm(newKey);

    expect(form.ingredients).toHaveLength(1);
    expect(form.steps).toHaveLength(1);
    expect(validateRecipeForm(form)["title"]).toBe("titleRequired");
  });
});
