import { Container, Stack } from "@mantine/core";
import { useDebouncedCallback } from "@mantine/hooks";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { errorCodeOf } from "../../../api/errors";
import { TagFilter } from "../../tags/components/TagFilter";
import { tagsQueryOptions } from "../../tags/queries";
import { type RecipesSearch, recipesQueryOptions } from "../queries";
import { withSearchText } from "../recipesSearch";
import { RecipeList } from "./RecipeList";
import { SearchBar, type SearchMode } from "./SearchBar";

type RecipesPageProps = {
  search: RecipesSearch;
  onSearchChange: (search: RecipesSearch) => void;
};

const SEARCH_DELAY_MS = 300;

export function RecipesPage({ search, onSearchChange }: RecipesPageProps) {
  const [mode, setMode] = useState<SearchMode>(
    search.ingredient === undefined ? "title" : "ingredient",
  );
  const [text, setText] = useState(search.ingredient ?? search.q ?? "");
  const applyText = useDebouncedCallback(
    (nextMode: SearchMode, nextText: string) =>
      onSearchChange(withSearchText(search, nextMode, nextText)),
    SEARCH_DELAY_MS,
  );
  const recipes = useQuery({ ...recipesQueryOptions(search), placeholderData: keepPreviousData });
  const tags = useQuery(tagsQueryOptions());
  const isFiltered = Object.keys(search).length > 0;

  return (
    <Container size="sm">
      <RecipeList
        recipes={recipes.data}
        isLoading={recipes.isPending}
        isFiltered={isFiltered}
        errorCode={recipes.isError ? errorCodeOf(recipes.error) : undefined}
        filters={
          <Stack gap="sm">
            <SearchBar
              value={text}
              mode={mode}
              onChange={(next) => {
                setText(next);
                applyText(mode, next);
              }}
              onModeChange={(next) => {
                setMode(next);
                onSearchChange(withSearchText(search, next, text));
              }}
            />
            {tags.data !== undefined && tags.data.length > 0 && (
              <TagFilter
                tags={tags.data}
                selectedTagId={search.tag}
                onChange={(tag) => {
                  const { tag: _previous, ...rest } = search;
                  onSearchChange(tag === undefined ? rest : { ...rest, tag });
                }}
              />
            )}
          </Stack>
        }
      />
    </Container>
  );
}
