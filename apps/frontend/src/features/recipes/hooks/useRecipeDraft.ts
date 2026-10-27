import { useState } from "react";

import { type RecipeDraft, draftKey, readDraft, removeDraft, writeDraft } from "../draft";
import type { RecipeFormValues } from "../form";

export const useRecipeDraft = (userId: string, recipeId: string | undefined) => {
  const key = draftKey(userId, recipeId);
  const [pendingDraft, setPendingDraft] = useState<RecipeDraft | undefined>(() => readDraft(key));

  return {
    pendingDraft,
    save: (values: RecipeFormValues) => {
      if (pendingDraft === undefined) {
        writeDraft(key, { savedAt: new Date().toISOString(), values });
      }
    },
    restore: () => setPendingDraft(undefined),
    discard: () => {
      removeDraft(key);
      setPendingDraft(undefined);
    },
    clear: () => removeDraft(key),
  };
};
