import { createFileRoute } from "@tanstack/react-router";

import { RecipesPage } from "../../../features/recipes/components/RecipesPage";
import { recipesQueryOptions } from "../../../features/recipes/queries";

export const Route = createFileRoute("/_authenticated/recipes/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(recipesQueryOptions()),
  component: RecipesPage,
});
