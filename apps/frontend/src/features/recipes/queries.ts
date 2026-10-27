import { $api } from "../../api/client";

export type RecipesSearch = {
  q?: string;
  ingredient?: string;
  tag?: string;
};

export const recipesQueryOptions = ({ q, ingredient, tag }: RecipesSearch = {}) =>
  $api.queryOptions("get", "/recipes", {
    params: {
      query: {
        ...(q === undefined ? {} : { q }),
        ...(ingredient === undefined ? {} : { ingredient }),
        ...(tag === undefined ? {} : { tag_id: tag }),
      },
    },
  });

export const recipeQueryOptions = (recipeId: string) =>
  $api.queryOptions("get", "/recipes/{recipe_id}", { params: { path: { recipe_id: recipeId } } });

export const recipeSharesQueryOptions = (recipeId: string) =>
  $api.queryOptions("get", "/recipes/{recipe_id}/shares", {
    params: { path: { recipe_id: recipeId } },
  });
