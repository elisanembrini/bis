import { createFileRoute } from "@tanstack/react-router";

import { RecipeDetailPage } from "../../../../features/recipes/components/RecipeDetailPage";
import { recipeQueryOptions } from "../../../../features/recipes/queries";

export const Route = createFileRoute("/_authenticated/recipes/$recipeId/")({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(recipeQueryOptions(params.recipeId)),
  component: RecipeDetailRoute,
});

function RecipeDetailRoute() {
  const { recipeId } = Route.useParams();
  return <RecipeDetailPage recipeId={recipeId} />;
}
