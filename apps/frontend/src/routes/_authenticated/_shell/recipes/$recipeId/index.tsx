import { createFileRoute } from "@tanstack/react-router";

import { validateServingsSearch } from "../../../../../features/cooking/cookSearch";
import { RecipeDetailPage } from "../../../../../features/recipes/components/RecipeDetailPage";
import { recipeQueryOptions } from "../../../../../features/recipes/queries";

type RecipeDetailSearch = { copied?: true; servings?: number };

export const Route = createFileRoute("/_authenticated/_shell/recipes/$recipeId/")({
  validateSearch: (search: Record<string, unknown>): RecipeDetailSearch => ({
    ...(search["copied"] === true ? { copied: true as const } : {}),
    ...validateServingsSearch(search),
  }),
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(recipeQueryOptions(params.recipeId)),
  component: RecipeDetailRoute,
});

function RecipeDetailRoute() {
  const { recipeId } = Route.useParams();
  const { copied, servings } = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <RecipeDetailPage
      recipeId={recipeId}
      justCopied={copied === true}
      servings={servings}
      onServingsChange={(next) =>
        void navigate({ search: (previous) => ({ ...previous, servings: next }), replace: true })
      }
    />
  );
}
