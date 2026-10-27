import { Loader, Stack, Title } from "@mantine/core";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import type { AppErrorCode } from "../../../api/errors";
import { photoUrl } from "../../../api/photos";
import { AnchorLink } from "../../../components/AnchorLink";
import { ButtonLink } from "../../../components/ButtonLink";
import { EmptyState } from "../../../components/EmptyState";
import { FormError } from "../../../components/FormError";
import { PlusIcon } from "../../../components/icons";
import { PlainList } from "../../../components/PlainList";
import { SectionTitle } from "../../../components/SectionTitle";
import type { RecipeSummary } from "../types";
import { RecipeListItem } from "./RecipeListItem";

type RecipeListProps = {
  recipes: RecipeSummary[] | undefined;
  isLoading?: boolean;
  errorCode?: AppErrorCode | undefined;
  thumbnailSrc?: (photoId: string) => string;
  isFiltered?: boolean;
  filters?: ReactNode;
};

const defaultThumbnailSrc = (photoId: string) => photoUrl(photoId, "thumb");

function RecipeItems({
  recipes,
  label,
  thumbnailSrc,
}: {
  recipes: RecipeSummary[];
  label: string;
  thumbnailSrc: (photoId: string) => string;
}) {
  return (
    <PlainList label={label}>
      {recipes.map((recipe) => (
        <li key={recipe.id}>
          <RecipeListItem recipe={recipe} thumbnailSrc={thumbnailSrc} />
        </li>
      ))}
    </PlainList>
  );
}

export function RecipeList({
  recipes,
  isLoading = false,
  errorCode,
  thumbnailSrc = defaultThumbnailSrc,
  isFiltered = false,
  filters,
}: RecipeListProps) {
  const { t } = useTranslation("recipes");
  const own = recipes?.filter((recipe) => recipe.is_own) ?? [];
  const shared = recipes?.filter((recipe) => !recipe.is_own) ?? [];

  return (
    <Stack gap="md">
      <Title order={1}>{t("list.title")}</Title>
      <ButtonLink to="/recipes/new" leftSection={<PlusIcon />}>
        {t("list.new")}
      </ButtonLink>
      {filters}
      {isLoading && <Loader />}
      <FormError code={errorCode} />
      {recipes?.length === 0 && isFiltered && (
        <EmptyState title={t("list.noResults")} description={t("list.noResultsHint")} />
      )}
      {recipes !== undefined && own.length === 0 && !isFiltered && (
        <EmptyState
          title={t("list.empty")}
          action={<AnchorLink to="/recipes/new">{t("list.emptyAction")}</AnchorLink>}
        />
      )}
      {own.length > 0 && (
        <RecipeItems recipes={own} label={t("list.title")} thumbnailSrc={thumbnailSrc} />
      )}
      {shared.length > 0 && (
        <Stack gap="sm" mt="md">
          <SectionTitle>{t("list.shared")}</SectionTitle>
          <RecipeItems recipes={shared} label={t("list.shared")} thumbnailSrc={thumbnailSrc} />
        </Stack>
      )}
    </Stack>
  );
}
