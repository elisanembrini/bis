import { createFileRoute } from "@tanstack/react-router";

import { CookPage } from "../../features/cooking/components/CookPage";
import { clampStep, validateCookSearch } from "../../features/cooking/cookSearch";
import { recipeQueryOptions } from "../../features/recipes/queries";

export const Route = createFileRoute("/_authenticated/recipes/$recipeId/cook")({
  validateSearch: validateCookSearch,
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(recipeQueryOptions(params.recipeId)),
  component: CookRoute,
});

function CookRoute() {
  const recipe = Route.useLoaderData();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const step = clampStep(search.step, recipe.steps.length);
  const servings = search.servings ?? recipe.servings;

  return (
    <CookPage
      recipe={recipe}
      step={step}
      servings={servings}
      onStepChange={(next) =>
        void navigate({ search: (previous) => ({ ...previous, step: next }), replace: true })
      }
      onServingsChange={(next) =>
        void navigate({ search: (previous) => ({ ...previous, servings: next }), replace: true })
      }
      onExit={() =>
        void navigate({
          to: "/recipes/$recipeId",
          params: { recipeId: recipe.id },
          search: servings === recipe.servings ? {} : { servings },
        })
      }
    />
  );
}
