import { $api } from "../../api/client";

export const recipesQueryOptions = () => $api.queryOptions("get", "/recipes");

export const recipeQueryOptions = (recipeId: string) =>
  $api.queryOptions("get", "/recipes/{recipe_id}", { params: { path: { recipe_id: recipeId } } });
