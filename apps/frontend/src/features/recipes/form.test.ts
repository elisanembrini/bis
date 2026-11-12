import { describe, expect, it } from "vitest";

import {
  type RecipeFormValues,
  emptyRecipeForm,
  formToRecipeInput,
  importedToForm,
  recipeToForm,
  validateRecipeForm,
} from "./form";
import type { ImportedRecipe, RecipeResponse } from "./types";

let counter = 0;
const newKey = () => {
  counter += 1;
  return `key-${counter}`;
};

const validForm = (): RecipeFormValues => ({
  title: "  Pasta al pomodoro ",
  notes: "",
  sourceUrl: "",
  rating: "",
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

describe("rating", () => {
  it("sends the chosen rating as a number, or null when there is none", () => {
    expect(formToRecipeInput({ ...validForm(), rating: "10" }).rating).toBe(10);
    expect(formToRecipeInput({ ...validForm(), rating: "1" }).rating).toBe(1);
    expect(formToRecipeInput({ ...validForm(), rating: "" }).rating).toBeNull();
  });

  it("starts unrated for a new or an imported recipe", () => {
    expect(emptyRecipeForm(newKey).rating).toBe("");
    const imported = importedToForm(
      {
        title: "Insalata",
        servings: 2,
        ingredients: [{ name: "lattuga" }],
        steps: [{ text: "Mescola." }],
      },
      newKey,
    );
    expect(imported.rating).toBe("");
  });
});

describe("source link", () => {
  it("accepts an empty link and web addresses", () => {
    for (const sourceUrl of ["", "  ", "https://example.com/ricetta?id=7", "http://example.com"]) {
      expect(validateRecipeForm({ ...validForm(), sourceUrl })).toEqual({});
    }
  });

  it("rejects anything that is not an http or https address", () => {
    for (const sourceUrl of [
      "javascript:alert(1)",
      "ftp://example.com/ricetta",
      "example.com/ricetta",
      "https://",
      "non è un indirizzo",
      `https://example.com/${"a".repeat(2048)}`,
    ]) {
      expect(validateRecipeForm({ ...validForm(), sourceUrl })).toEqual({
        sourceUrl: "sourceUrlInvalid",
      });
    }
  });

  it("sends the trimmed link, or null when empty", () => {
    expect(
      formToRecipeInput({ ...validForm(), sourceUrl: "  https://example.com/a  " }).source_url,
    ).toBe("https://example.com/a");
    expect(formToRecipeInput({ ...validForm(), sourceUrl: "  " }).source_url).toBeNull();
  });
});

describe("formToRecipeInput", () => {
  it("converts Italian quantities, timers and empty fields", () => {
    expect(formToRecipeInput(validForm())).toEqual({
      title: "Pasta al pomodoro",
      notes: null,
      source_url: null,
      rating: null,
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
      source_url: "https://example.com/pasta",
      rating: 7,
      prep_minutes: null,
      cook_minutes: 15,
      servings: 2,
      cover_photo_id: "p1",
      tags: [{ id: "t2", name: "Dolci", key: "desserts" }],
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
      ingredients: [{ id: "i1", quantity: "1.500", unit: "kg", name: "farina" }],
      steps: [{ id: "s1", text: "Impasta", timer_seconds: 90, photo_id: "p2" }],
    };

    const form = recipeToForm(recipe);

    expect(form.ingredients[0]).toEqual({ key: "i1", quantity: "1,5", unit: "kg", name: "farina" });
    expect(form.sourceUrl).toBe("https://example.com/pasta");
    expect(form.rating).toBe("7");
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
    expect(input.source_url).toBe("https://example.com/pasta");
    expect(input.rating).toBe(7);
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

describe("importedToForm", () => {
  const imported: ImportedRecipe = {
    title: "Pasta al pomodoro",
    notes: null,
    prep_minutes: 10,
    cook_minutes: null,
    servings: 4,
    ingredients: [
      { quantity: "320.000", unit: "g", name: "spaghetti" },
      { quantity: null, unit: null, name: "sale" },
    ],
    steps: [
      { text: "Porta a bollore l'acqua.", timer_seconds: null },
      { text: "Cuoci la pasta.", timer_seconds: 545 },
    ],
  };

  it("fills the form with fresh keys and without photos or tags", () => {
    const form = importedToForm(imported, newKey);

    expect(form).toMatchObject({
      title: "Pasta al pomodoro",
      notes: "",
      prepMinutes: "10",
      cookMinutes: "",
      servings: "4",
      coverPhotoId: null,
      tagIds: [],
    });
    expect(form.ingredients.map(({ quantity, unit, name }) => ({ quantity, unit, name }))).toEqual([
      { quantity: "320", unit: "g", name: "spaghetti" },
      { quantity: "", unit: "", name: "sale" },
    ]);
    expect(
      form.steps.map(({ timerMinutes, timerSeconds }) => [timerMinutes, timerSeconds]),
    ).toEqual([
      ["", ""],
      ["9", "5"],
    ]);
    const keys = [...form.ingredients, ...form.steps].map((item) => item.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("keeps the link the recipe was imported from", () => {
    const form = importedToForm(imported, newKey, "https://example.com/ricetta");

    expect(form.sourceUrl).toBe("https://example.com/ricetta");
    expect(importedToForm(imported, newKey).sourceUrl).toBe("");
  });

  it("treats omitted optional fields as empty", () => {
    const form = importedToForm(
      {
        title: "Insalata",
        servings: 2,
        ingredients: [{ name: "lattuga" }],
        steps: [{ text: "Mescola." }],
      },
      newKey,
    );

    expect(form.notes).toBe("");
    expect(form.prepMinutes).toBe("");
    expect(form.ingredients[0]).toMatchObject({ quantity: "", unit: "" });
    expect(form.steps[0]).toMatchObject({ timerMinutes: "", timerSeconds: "" });
  });

  it("produces a form that validates", () => {
    expect(validateRecipeForm(importedToForm(imported, newKey))).toEqual({});
  });
});
