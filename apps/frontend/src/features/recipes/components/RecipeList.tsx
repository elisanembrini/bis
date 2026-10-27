import { List, Loader, Paper, Stack, Text, Title } from "@mantine/core";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import type { AppErrorCode } from "../../../api/errors";
import { photoUrl } from "../../../api/photos";
import { AnchorLink } from "../../../components/AnchorLink";
import { ButtonLink } from "../../../components/ButtonLink";
import { FormError } from "../../../components/FormError";
import { PlusIcon } from "../../../components/icons";
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
    <List listStyleType="none" spacing="sm" p={0} m={0} aria-label={label}>
      {recipes.map((recipe) => (
        <List.Item key={recipe.id}>
          <RecipeListItem recipe={recipe} thumbnailSrc={thumbnailSrc} />
        </List.Item>
      ))}
    </List>
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
        <Paper withBorder p="lg">
          <Stack gap={4}>
            <Text fw={500}>{t("list.noResults")}</Text>
            <Text size="sm" c="dimmed">
              {t("list.noResultsHint")}
            </Text>
          </Stack>
        </Paper>
      )}
      {recipes !== undefined && own.length === 0 && !isFiltered && (
        <Paper withBorder p="lg">
          <Stack gap="sm" align="flex-start">
            <Text>{t("list.empty")}</Text>
            <AnchorLink to="/recipes/new">{t("list.emptyAction")}</AnchorLink>
          </Stack>
        </Paper>
      )}
      {own.length > 0 && (
        <RecipeItems recipes={own} label={t("list.title")} thumbnailSrc={thumbnailSrc} />
      )}
      {shared.length > 0 && (
        <Stack gap="sm" mt="md">
          <Title order={2} size="h3">
            {t("list.shared")}
          </Title>
          <RecipeItems recipes={shared} label={t("list.shared")} thumbnailSrc={thumbnailSrc} />
        </Stack>
      )}
    </Stack>
  );
}
