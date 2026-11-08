import { createFileRoute } from "@tanstack/react-router";

import { RecipeEditorPage } from "../../../../features/recipes/components/RecipeEditorPage";
import { emptyRecipeForm } from "../../../../features/recipes/form";
import { featuresQueryOptions } from "../../../../features/recipes/queries";
import { tagsQueryOptions } from "../../../../features/tags/queries";

export const Route = createFileRoute("/_authenticated/_shell/recipes/new")({
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(tagsQueryOptions()),
      context.queryClient.ensureQueryData(featuresQueryOptions()),
    ]);
  },
  component: NewRecipeRoute,
});

function NewRecipeRoute() {
  const { me } = Route.useRouteContext();
  return (
    <RecipeEditorPage userId={me.id} recipeId={undefined} createInitialValues={emptyRecipeForm} />
  );
}
