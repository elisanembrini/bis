import { Container } from "@mantine/core";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { errorCodeOf } from "../../../api/errors";
import type { RecipeFormValues } from "../form";
import { useRecipeDraft } from "../hooks/useRecipeDraft";
import { useRecipeMutations } from "../hooks/useRecipeMutations";
import { RecipeEditor } from "./RecipeEditor";

type RecipeEditorPageProps = {
  userId: string;
  recipeId: string | undefined;
  createInitialValues: (newKey: () => string) => RecipeFormValues;
};

const newKey = () => crypto.randomUUID();

export function RecipeEditorPage({ userId, recipeId, createInitialValues }: RecipeEditorPageProps) {
  const { t } = useTranslation("recipes");
  const navigate = useNavigate();
  const draft = useRecipeDraft(userId, recipeId);
  const [initialValues] = useState(() => createInitialValues(newKey));
  const { create, update } = useRecipeMutations(draft.clear);
  const mutation = recipeId === undefined ? create : update;

  return (
    <Container size="sm">
      <RecipeEditor
        heading={recipeId === undefined ? t("editor.newTitle") : t("editor.editTitle")}
        initialValues={initialValues}
        newKey={newKey}
        onChange={draft.save}
        pendingDraft={draft.pendingDraft}
        onRestoreDraft={draft.restore}
        onDiscardDraft={draft.discard}
        onCancel={() =>
          void (recipeId === undefined
            ? navigate({ to: "/recipes" })
            : navigate({ to: "/recipes/$recipeId", params: { recipeId } }))
        }
        onSubmit={(body) =>
          recipeId === undefined
            ? create.mutate({ body })
            : update.mutate({ body, params: { path: { recipe_id: recipeId } } })
        }
        isSubmitting={mutation.isPending}
        errorCode={mutation.isError ? errorCodeOf(mutation.error) : undefined}
      />
    </Container>
  );
}
