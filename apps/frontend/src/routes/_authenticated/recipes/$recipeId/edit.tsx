import { createFileRoute } from "@tanstack/react-router";

import { RecipeEditorPage } from "../../../../features/recipes/components/RecipeEditorPage";
import { recipeToForm } from "../../../../features/recipes/form";
import { recipeQueryOptions } from "../../../../features/recipes/queries";
import { tagsQueryOptions } from "../../../../features/tags/queries";

export const Route = createFileRoute("/_authenticated/recipes/$recipeId/edit")({
  loader: async ({ context, params }) => {
    await context.queryClient.ensureQueryData(tagsQueryOptions());
    return context.queryClient.ensureQueryData(recipeQueryOptions(params.recipeId));
  },
  component: EditRecipeRoute,
});

function EditRecipeRoute() {
  const { me } = Route.useRouteContext();
  const recipe = Route.useLoaderData();
  return (
    <RecipeEditorPage
      userId={me.id}
      recipeId={recipe.id}
      createInitialValues={() => recipeToForm(recipe)}
    />
  );
}
