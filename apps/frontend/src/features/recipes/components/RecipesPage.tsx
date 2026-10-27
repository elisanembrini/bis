import { Container } from "@mantine/core";
import { useQuery } from "@tanstack/react-query";

import { errorCodeOf } from "../../../api/errors";
import { recipesQueryOptions } from "../queries";
import { RecipeList } from "./RecipeList";

export function RecipesPage() {
  const recipes = useQuery(recipesQueryOptions());

  return (
    <Container size="sm">
      <RecipeList
        recipes={recipes.data}
        isLoading={recipes.isPending}
        errorCode={recipes.isError ? errorCodeOf(recipes.error) : undefined}
      />
    </Container>
  );
}
