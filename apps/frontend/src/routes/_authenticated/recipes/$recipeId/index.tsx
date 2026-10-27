import { createFileRoute } from "@tanstack/react-router";

import { RecipeDetailPage } from "../../../../features/recipes/components/RecipeDetailPage";
import { recipeQueryOptions } from "../../../../features/recipes/queries";

type RecipeDetailSearch = { copied?: true };

export const Route = createFileRoute("/_authenticated/recipes/$recipeId/")({
  validateSearch: (search: Record<string, unknown>): RecipeDetailSearch =>
    search["copied"] === true ? { copied: true } : {},
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(recipeQueryOptions(params.recipeId)),
  component: RecipeDetailRoute,
});

function RecipeDetailRoute() {
  const { recipeId } = Route.useParams();
  const { copied } = Route.useSearch();
  return <RecipeDetailPage recipeId={recipeId} justCopied={copied === true} />;
}
