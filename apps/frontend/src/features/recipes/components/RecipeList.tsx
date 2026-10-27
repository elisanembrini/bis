import { Center, Group, Image, List, Loader, Paper, Stack, Text, Title } from "@mantine/core";
import { useTranslation } from "react-i18next";

import type { AppErrorCode } from "../../../api/errors";
import { photoUrl } from "../../../api/photos";
import { AnchorLink } from "../../../components/AnchorLink";
import { ButtonLink } from "../../../components/ButtonLink";
import { FormError } from "../../../components/FormError";
import { PhotoIcon, PlusIcon } from "../../../components/icons";
import { useFormatDuration } from "../hooks/useFormatDuration";
import type { RecipeSummary } from "../types";

import classes from "./RecipeList.module.css";

type RecipeListProps = {
  recipes: RecipeSummary[] | undefined;
  isLoading?: boolean;
  errorCode?: AppErrorCode | undefined;
  thumbnailSrc?: (photoId: string) => string;
};

const THUMBNAIL_SIZE = 72;

const defaultThumbnailSrc = (photoId: string) => photoUrl(photoId, "thumb");

export function RecipeList({
  recipes,
  isLoading = false,
  errorCode,
  thumbnailSrc = defaultThumbnailSrc,
}: RecipeListProps) {
  const { t } = useTranslation("recipes");
  const formatDuration = useFormatDuration();

  return (
    <Stack gap="md">
      <Title order={1}>{t("list.title")}</Title>
      <ButtonLink to="/recipes/new" leftSection={<PlusIcon />}>
        {t("list.new")}
      </ButtonLink>
      {isLoading && <Loader />}
      <FormError code={errorCode} />
      {recipes?.length === 0 && (
        <Paper withBorder p="lg">
          <Stack gap="sm" align="flex-start">
            <Text>{t("list.empty")}</Text>
            <AnchorLink to="/recipes/new">{t("list.emptyAction")}</AnchorLink>
          </Stack>
        </Paper>
      )}
      {recipes !== undefined && recipes.length > 0 && (
        <List listStyleType="none" spacing="sm" p={0} m={0}>
          {recipes.map((recipe) => {
            const totalMinutes = (recipe.prep_minutes ?? 0) + (recipe.cook_minutes ?? 0);
            return (
              <List.Item key={recipe.id}>
                <Paper withBorder p="sm">
                  <Group gap="md" wrap="nowrap">
                    {recipe.cover_photo_id === null ? (
                      <Center
                        w={THUMBNAIL_SIZE}
                        h={THUMBNAIL_SIZE}
                        bg="gray.1"
                        c="gray.5"
                        className={classes.thumbnail}
                      >
                        <PhotoIcon size={28} />
                      </Center>
                    ) : (
                      <Image
                        src={thumbnailSrc(recipe.cover_photo_id)}
                        alt=""
                        w={THUMBNAIL_SIZE}
                        h={THUMBNAIL_SIZE}
                        radius="md"
                        fit="cover"
                        className={classes.thumbnail}
                      />
                    )}
                    <Stack gap={4}>
                      <AnchorLink
                        to="/recipes/$recipeId"
                        params={{ recipeId: recipe.id }}
                        fw={600}
                        size="lg"
                      >
                        {recipe.title}
                      </AnchorLink>
                      <Text size="sm" c="dimmed">
                        {[
                          t("list.servings", { count: recipe.servings }),
                          totalMinutes > 0 ? formatDuration(totalMinutes * 60) : null,
                        ]
                          .filter((part) => part !== null)
                          .join(" · ")}
                      </Text>
                    </Stack>
                  </Group>
                </Paper>
              </List.Item>
            );
          })}
        </List>
      )}
    </Stack>
  );
}
