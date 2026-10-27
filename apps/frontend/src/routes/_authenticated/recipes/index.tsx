import { createFileRoute } from "@tanstack/react-router";

import { RecipesPage } from "../../../features/recipes/components/RecipesPage";
import { recipesQueryOptions } from "../../../features/recipes/queries";
import { validateRecipesSearch } from "../../../features/recipes/recipesSearch";
import { tagsQueryOptions } from "../../../features/tags/queries";

export const Route = createFileRoute("/_authenticated/recipes/")({
  validateSearch: validateRecipesSearch,
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) =>
    Promise.all([
      context.queryClient.ensureQueryData(recipesQueryOptions(deps)),
      context.queryClient.ensureQueryData(tagsQueryOptions()),
    ]),
  component: RecipesRoute,
});

function RecipesRoute() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <RecipesPage
      search={search}
      onSearchChange={(next) => void navigate({ search: next, replace: true })}
    />
  );
}
