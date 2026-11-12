import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { errorCodeOf } from "../../../api/errors";
import { PageContainer } from "../../../components/PageContainer";
import { tagsQueryOptions } from "../../tags/queries";
import { type RecipeFormValues, importedToForm } from "../form";
import { useRecipeDraft } from "../hooks/useRecipeDraft";
import { useRecipeImport } from "../hooks/useRecipeImport";
import { useRecipeMutations } from "../hooks/useRecipeMutations";
import { featuresQueryOptions } from "../queries";
import { RecipeEditor } from "./RecipeEditor";
import { RecipeImportPanel } from "./RecipeImportPanel";

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
  const [initialValues, setInitialValues] = useState(() => createInitialValues(newKey));
  const [editorVersion, setEditorVersion] = useState(0);
  const features = useQuery(featuresQueryOptions());
  const recipeImport = useRecipeImport();
  const { create, update } = useRecipeMutations(draft.clear);
  const mutation = recipeId === undefined ? create : update;
  const tags = useQuery(tagsQueryOptions());

  return (
    <PageContainer>
      {recipeId === undefined && features.data?.recipe_import === true && (
        <RecipeImportPanel
          isLoading={recipeImport.isPending}
          isDone={recipeImport.isSuccess}
          errorCode={recipeImport.isError ? errorCodeOf(recipeImport.error) : undefined}
          onImport={(body) =>
            recipeImport.mutate(
              { body },
              {
                onSuccess: (imported) => {
                  setInitialValues(importedToForm(imported, newKey, body.url ?? ""));
                  setEditorVersion((version) => version + 1);
                },
              },
            )
          }
        />
      )}
      <RecipeEditor
        key={editorVersion}
        heading={recipeId === undefined ? t("editor.newTitle") : t("editor.editTitle")}
        initialValues={initialValues}
        availableTags={tags.data ?? []}
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
    </PageContainer>
  );
}
