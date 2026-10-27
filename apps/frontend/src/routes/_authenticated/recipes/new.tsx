import { createFileRoute } from "@tanstack/react-router";

import { RecipeEditorPage } from "../../../features/recipes/components/RecipeEditorPage";
import { emptyRecipeForm } from "../../../features/recipes/form";

export const Route = createFileRoute("/_authenticated/recipes/new")({
  component: NewRecipeRoute,
});

function NewRecipeRoute() {
  const { me } = Route.useRouteContext();
  return (
    <RecipeEditorPage userId={me.id} recipeId={undefined} createInitialValues={emptyRecipeForm} />
  );
}
