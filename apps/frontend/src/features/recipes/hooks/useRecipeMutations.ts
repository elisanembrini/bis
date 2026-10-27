import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

import { $api } from "../../../api/client";
import { recipeQueryOptions, recipesQueryOptions } from "../queries";
import type { RecipeResponse } from "../types";

export const useRecipeMutations = (onSaved: () => void) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const afterSave = async (recipe: RecipeResponse) => {
    onSaved();
    queryClient.setQueryData(recipeQueryOptions(recipe.id).queryKey, recipe);
    await queryClient.invalidateQueries({ queryKey: recipesQueryOptions().queryKey });
    await navigate({ to: "/recipes/$recipeId", params: { recipeId: recipe.id } });
  };

  const create = $api.useMutation("post", "/recipes", { onSuccess: afterSave });
  const update = $api.useMutation("put", "/recipes/{recipe_id}", { onSuccess: afterSave });

  return { create, update };
};

export const useDeleteRecipe = (recipeId: string) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return $api.useMutation("delete", "/recipes/{recipe_id}", {
    onSuccess: async () => {
      queryClient.removeQueries({ queryKey: recipeQueryOptions(recipeId).queryKey });
      await queryClient.invalidateQueries({ queryKey: recipesQueryOptions().queryKey });
      await navigate({ to: "/recipes" });
    },
  });
};
