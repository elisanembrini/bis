import { Container, Loader } from "@mantine/core";
import { useQuery } from "@tanstack/react-query";

import { errorCodeOf } from "../../../api/errors";
import { FormError } from "../../../components/FormError";
import { useDeleteRecipe } from "../hooks/useRecipeMutations";
import { recipeQueryOptions } from "../queries";
import { RecipeDetail } from "./RecipeDetail";

type RecipeDetailPageProps = {
  recipeId: string;
};

export function RecipeDetailPage({ recipeId }: RecipeDetailPageProps) {
  const recipe = useQuery(recipeQueryOptions(recipeId));
  const deleteRecipe = useDeleteRecipe(recipeId);

  if (recipe.isPending) {
    return <Loader />;
  }
  if (recipe.isError) {
    return <FormError code={errorCodeOf(recipe.error)} />;
  }

  return (
    <Container size="sm">
      <RecipeDetail
        recipe={recipe.data}
        onDelete={() => deleteRecipe.mutate({ params: { path: { recipe_id: recipeId } } })}
        isDeleting={deleteRecipe.isPending}
        errorCode={deleteRecipe.isError ? errorCodeOf(deleteRecipe.error) : undefined}
      />
    </Container>
  );
}
