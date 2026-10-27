import { Badge, Center, Group, Image, Paper, Stack, Text } from "@mantine/core";
import { useTranslation } from "react-i18next";

import { AnchorLink } from "../../../components/AnchorLink";
import { PhotoIcon, SharedIcon } from "../../../components/icons";
import { useFormatDuration } from "../hooks/useFormatDuration";
import type { RecipeSummary } from "../types";

import classes from "./RecipeList.module.css";

type RecipeListItemProps = {
  recipe: RecipeSummary;
  thumbnailSrc: (photoId: string) => string;
};

const THUMBNAIL_SIZE = 72;

export function RecipeListItem({ recipe, thumbnailSrc }: RecipeListItemProps) {
  const { t } = useTranslation("recipes");
  const formatDuration = useFormatDuration();
  const totalMinutes = (recipe.prep_minutes ?? 0) + (recipe.cook_minutes ?? 0);
  const details = [
    recipe.is_own ? null : t("list.by", { name: recipe.author.display_name }),
    t("list.servings", { count: recipe.servings }),
    totalMinutes > 0 ? formatDuration(totalMinutes * 60) : null,
  ].filter((part) => part !== null);

  return (
    <Paper withBorder p="sm" {...(recipe.is_own ? {} : { bg: "inchiostro.0" })}>
      <Group gap="md" wrap="nowrap">
        {recipe.cover_photo_id === null ? (
          <Center
            w={THUMBNAIL_SIZE}
            h={THUMBNAIL_SIZE}
            bg="inchiostro.0"
            c="inchiostro.4"
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
          <Group gap="xs">
            <AnchorLink to="/recipes/$recipeId" params={{ recipeId: recipe.id }} fw={600} size="lg">
              {recipe.title}
            </AnchorLink>
            {!recipe.is_own && (
              <Badge size="md" tt="none" leftSection={<SharedIcon size={14} />}>
                {t("list.sharedBadge")}
              </Badge>
            )}
          </Group>
          <Text size="sm" c="dimmed">
            {details.join(" · ")}
          </Text>
        </Stack>
      </Group>
    </Paper>
  );
}
