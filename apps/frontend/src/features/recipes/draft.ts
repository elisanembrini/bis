import type { RecipeFormValues } from "./form";

export type RecipeDraft = {
  savedAt: string;
  values: RecipeFormValues;
};

const PREFIX = "bis:recipe-draft:";

export const draftKey = (userId: string, recipeId: string | undefined): string =>
  `${PREFIX}${userId}:${recipeId ?? "new"}`;

const isDraft = (value: unknown): value is RecipeDraft =>
  typeof value === "object" &&
  value !== null &&
  "savedAt" in value &&
  typeof value.savedAt === "string" &&
  "values" in value &&
  typeof value.values === "object" &&
  value.values !== null;

export const readDraft = (key: string): RecipeDraft | undefined => {
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) {
      return undefined;
    }
    const parsed: unknown = JSON.parse(raw);
    return isDraft(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
};

export const writeDraft = (key: string, draft: RecipeDraft): void => {
  try {
    window.localStorage.setItem(key, JSON.stringify(draft));
  } catch {
    return;
  }
};

export const removeDraft = (key: string): void => {
  try {
    window.localStorage.removeItem(key);
  } catch {
    return;
  }
};

export const removeDraftsOf = (userId: string): void => {
  try {
    const prefix = `${PREFIX}${userId}:`;
    const keys = Array.from({ length: window.localStorage.length }, (_, index) =>
      window.localStorage.key(index),
    );
    for (const key of keys) {
      if (key?.startsWith(prefix)) {
        window.localStorage.removeItem(key);
      }
    }
  } catch {
    return;
  }
};
