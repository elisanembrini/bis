import { Container, Loader } from "@mantine/core";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";

import { $api } from "../../../api/client";
import { errorCodeOf } from "../../../api/errors";
import { FormError } from "../../../components/FormError";
import { useDeleteRecipe } from "../hooks/useRecipeMutations";
import { recipeQueryOptions, recipeSharesQueryOptions, recipesQueryOptions } from "../queries";
import { RecipeDetail } from "./RecipeDetail";
import { ShareDialog } from "./ShareDialog";

type RecipeDetailPageProps = {
  recipeId: string;
  justCopied: boolean;
};

export function RecipeDetailPage({ recipeId, justCopied }: RecipeDetailPageProps) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [sharing, setSharing] = useState(false);
  const recipe = useQuery(recipeQueryOptions(recipeId));
  const isOwn = recipe.data?.is_own === true;
  const shares = useQuery({ ...recipeSharesQueryOptions(recipeId), enabled: isOwn });
  const deleteRecipe = useDeleteRecipe(recipeId);
  const saveShares = $api.useMutation("put", "/recipes/{recipe_id}/shares", {
    onSuccess: (candidates) => {
      queryClient.setQueryData(recipeSharesQueryOptions(recipeId).queryKey, candidates);
      setSharing(false);
    },
  });
  const copy = $api.useMutation("post", "/recipes/{recipe_id}/copy", {
    onSuccess: async (copied) => {
      queryClient.setQueryData(recipeQueryOptions(copied.id).queryKey, copied);
      await queryClient.invalidateQueries({ queryKey: recipesQueryOptions().queryKey });
      await navigate({
        to: "/recipes/$recipeId",
        params: { recipeId: copied.id },
        search: { copied: true },
      });
    },
  });

  if (recipe.isPending) {
    return <Loader />;
  }
  if (recipe.isError) {
    return <FormError code={errorCodeOf(recipe.error)} />;
  }

  const failed = deleteRecipe.isError ? deleteRecipe.error : copy.isError ? copy.error : undefined;

  return (
    <Container size="sm">
      <RecipeDetail
        key={recipe.data.id}
        recipe={recipe.data}
        onDelete={() => deleteRecipe.mutate({ params: { path: { recipe_id: recipeId } } })}
        onCopy={() => copy.mutate({ params: { path: { recipe_id: recipeId } } })}
        onShare={() => {
          saveShares.reset();
          setSharing(true);
        }}
        isDeleting={deleteRecipe.isPending}
        isCopying={copy.isPending}
        justCopied={justCopied}
        sharedWith={
          shares.data
            ?.filter((candidate) => candidate.shared)
            .map((candidate) => candidate.display_name) ?? []
        }
        errorCode={failed === undefined ? undefined : errorCodeOf(failed)}
      />
      {isOwn && (
        <ShareDialog
          key={sharing ? "open" : "closed"}
          opened={sharing}
          recipeTitle={recipe.data.title}
          candidates={shares.data}
          loadErrorCode={shares.isError ? errorCodeOf(shares.error) : undefined}
          onSave={(userIds) =>
            saveShares.mutate({
              params: { path: { recipe_id: recipeId } },
              body: { user_ids: userIds },
            })
          }
          onClose={() => setSharing(false)}
          isSaving={saveShares.isPending}
          saveErrorCode={saveShares.isError ? errorCodeOf(saveShares.error) : undefined}
        />
      )}
    </Container>
  );
}
