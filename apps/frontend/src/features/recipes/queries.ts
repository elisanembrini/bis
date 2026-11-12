import { $api } from "../../api/client";
import type { RecipeSort } from "./rating";

export type RecipesSearch = {
  q?: string;
  ingredient?: string;
  tag?: string;
  minRating?: number;
  sort?: RecipeSort;
};

export const recipesQueryOptions = ({ q, ingredient, tag, minRating, sort }: RecipesSearch = {}) =>
  $api.queryOptions("get", "/recipes", {
    params: {
      query: {
        ...(q === undefined ? {} : { q }),
        ...(ingredient === undefined ? {} : { ingredient }),
        ...(tag === undefined ? {} : { tag_id: tag }),
        ...(minRating === undefined ? {} : { min_rating: minRating }),
        ...(sort === undefined ? {} : { sort }),
      },
    },
  });

export const recipeQueryOptions = (recipeId: string) =>
  $api.queryOptions("get", "/recipes/{recipe_id}", { params: { path: { recipe_id: recipeId } } });

export const recipeSharesQueryOptions = (recipeId: string) =>
  $api.queryOptions("get", "/recipes/{recipe_id}/shares", {
    params: { path: { recipe_id: recipeId } },
  });

export const featuresQueryOptions = () => $api.queryOptions("get", "/features");
