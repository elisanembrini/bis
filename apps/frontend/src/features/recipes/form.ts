import { splitTimer, joinTimer } from "./duration";
import { parseQuantity, quantityToInput } from "./quantity";
import {
  type ImportedRecipe,
  type RecipeInput,
  type RecipeResponse,
  type Unit,
  isUnit,
} from "./types";

export type IngredientFormValue = {
  key: string;
  quantity: string;
  unit: Unit | "";
  name: string;
};

export type StepFormValue = {
  key: string;
  text: string;
  timerMinutes: string;
  timerSeconds: string;
  photoId: string | null;
};

export type RecipeFormValues = {
  title: string;
  notes: string;
  prepMinutes: string;
  cookMinutes: string;
  servings: string;
  coverPhotoId: string | null;
  tagIds: string[];
  ingredients: IngredientFormValue[];
  steps: StepFormValue[];
};

export type RecipeFormErrorKey =
  | "titleRequired"
  | "servingsInvalid"
  | "minutesInvalid"
  | "ingredientsRequired"
  | "stepsRequired"
  | "ingredientNameRequired"
  | "quantityInvalid"
  | "stepTextRequired"
  | "timerSecondsInvalid"
  | "timerTooLong";

export type RecipeFormErrors = Record<string, RecipeFormErrorKey>;

export const SERVINGS_MAX = 100;
export const MINUTES_MAX = 10000;
export const TIMER_MAX_SECONDS = 86400;

export const emptyIngredient = (key: string): IngredientFormValue => ({
  key,
  quantity: "",
  unit: "",
  name: "",
});

export const emptyStep = (key: string): StepFormValue => ({
  key,
  text: "",
  timerMinutes: "",
  timerSeconds: "",
  photoId: null,
});

export const emptyRecipeForm = (newKey: () => string): RecipeFormValues => ({
  title: "",
  notes: "",
  prepMinutes: "",
  cookMinutes: "",
  servings: "4",
  coverPhotoId: null,
  tagIds: [],
  ingredients: [emptyIngredient(newKey())],
  steps: [emptyStep(newKey())],
});

export const recipeToForm = (recipe: RecipeResponse): RecipeFormValues => ({
  title: recipe.title,
  notes: recipe.notes ?? "",
  prepMinutes: recipe.prep_minutes === null ? "" : String(recipe.prep_minutes),
  cookMinutes: recipe.cook_minutes === null ? "" : String(recipe.cook_minutes),
  servings: String(recipe.servings),
  coverPhotoId: recipe.cover_photo_id,
  tagIds: recipe.tags.map((tag) => tag.id),
  ingredients: recipe.ingredients.map((ingredient) => ({
    key: ingredient.id,
    quantity: quantityToInput(ingredient.quantity),
    unit: ingredient.unit ?? "",
    name: ingredient.name,
  })),
  steps: recipe.steps.map((step) => {
    const timer = splitTimer(step.timer_seconds);
    return {
      key: step.id,
      text: step.text,
      timerMinutes: timer.minutes,
      timerSeconds: timer.seconds,
      photoId: step.photo_id,
    };
  }),
});

const numberToInput = (value: number | null | undefined): string =>
  value === null || value === undefined ? "" : String(value);

export const importedToForm = (recipe: ImportedRecipe, newKey: () => string): RecipeFormValues => ({
  title: recipe.title,
  notes: recipe.notes ?? "",
  prepMinutes: numberToInput(recipe.prep_minutes),
  cookMinutes: numberToInput(recipe.cook_minutes),
  servings: String(recipe.servings),
  coverPhotoId: null,
  tagIds: [],
  ingredients: recipe.ingredients.map((ingredient) => ({
    key: newKey(),
    quantity: quantityToInput(ingredient.quantity ?? null),
    unit: ingredient.unit ?? "",
    name: ingredient.name,
  })),
  steps: recipe.steps.map((step) => {
    const timer = splitTimer(step.timer_seconds ?? null);
    return {
      key: newKey(),
      text: step.text,
      timerMinutes: timer.minutes,
      timerSeconds: timer.seconds,
      photoId: null,
    };
  }),
});

const WHOLE_NUMBER = /^\d+$/;

const optionalWholeNumber = (value: string): number | null | undefined => {
  const trimmed = value.trim();
  if (trimmed === "") {
    return null;
  }
  return WHOLE_NUMBER.test(trimmed) ? Number(trimmed) : undefined;
};

export const validateRecipeForm = (values: RecipeFormValues): RecipeFormErrors => {
  const errors: RecipeFormErrors = {};
  if (values.title.trim() === "") {
    errors["title"] = "titleRequired";
  }
  const servings = optionalWholeNumber(values.servings);
  if (servings === null || servings === undefined || servings < 1 || servings > SERVINGS_MAX) {
    errors["servings"] = "servingsInvalid";
  }
  for (const field of ["prepMinutes", "cookMinutes"] as const) {
    const minutes = optionalWholeNumber(values[field]);
    if (minutes === undefined || (minutes !== null && minutes > MINUTES_MAX)) {
      errors[field] = "minutesInvalid";
    }
  }
  if (values.ingredients.length === 0) {
    errors["ingredients"] = "ingredientsRequired";
  }
  values.ingredients.forEach((ingredient, index) => {
    if (ingredient.name.trim() === "") {
      errors[`ingredients.${index}.name`] = "ingredientNameRequired";
    }
    if (!parseQuantity(ingredient.quantity).ok) {
      errors[`ingredients.${index}.quantity`] = "quantityInvalid";
    }
  });
  if (values.steps.length === 0) {
    errors["steps"] = "stepsRequired";
  }
  values.steps.forEach((step, index) => {
    if (step.text.trim() === "") {
      errors[`steps.${index}.text`] = "stepTextRequired";
    }
    const minutes = optionalWholeNumber(step.timerMinutes);
    const seconds = optionalWholeNumber(step.timerSeconds);
    if (minutes === undefined || seconds === undefined || (seconds ?? 0) > 59) {
      errors[`steps.${index}.timerSeconds`] = "timerSecondsInvalid";
    } else if ((minutes ?? 0) * 60 + (seconds ?? 0) > TIMER_MAX_SECONDS) {
      errors[`steps.${index}.timerMinutes`] = "timerTooLong";
    }
  });
  return errors;
};

export const formToRecipeInput = (values: RecipeFormValues): RecipeInput => ({
  title: values.title.trim(),
  notes: values.notes.trim() === "" ? null : values.notes.trim(),
  prep_minutes: optionalWholeNumber(values.prepMinutes) ?? null,
  cook_minutes: optionalWholeNumber(values.cookMinutes) ?? null,
  servings: Number(values.servings.trim()),
  cover_photo_id: values.coverPhotoId,
  tag_ids: values.tagIds,
  ingredients: values.ingredients.map((ingredient) => {
    const parsed = parseQuantity(ingredient.quantity);
    return {
      quantity: parsed.ok ? parsed.value : null,
      unit: isUnit(ingredient.unit) ? ingredient.unit : null,
      name: ingredient.name.trim(),
    };
  }),
  steps: values.steps.map((step) => ({
    text: step.text.trim(),
    timer_seconds: joinTimer(step.timerMinutes, step.timerSeconds),
    photo_id: step.photoId,
  })),
});
