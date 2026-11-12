import {
  Anchor,
  AspectRatio,
  Badge,
  Button,
  Group,
  Image,
  List,
  SimpleGrid,
  Stack,
  Text,
} from "@mantine/core";
import { useUncontrolled } from "@mantine/hooks";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import type { AppErrorCode } from "../../../api/errors";
import { photoUrl } from "../../../api/photos";
import { ButtonLink } from "../../../components/ButtonLink";
import { ConfirmDialog } from "../../../components/ConfirmDialog";
import { FormError } from "../../../components/FormError";
import { HandwrittenTitle } from "../../../components/HandwrittenTitle";
import { ChefIcon, ShareIcon } from "../../../components/icons";
import { InfoMessage, SuccessMessage } from "../../../components/Messages";
import { FullBleed } from "../../../components/PageContainer";
import { SectionTitle } from "../../../components/SectionTitle";
import { formatList } from "../../../i18n/formatList";
import { useTagLabel } from "../../tags/useTagLabel";
import { useFormatDuration } from "../hooks/useFormatDuration";
import { sourceHost } from "../sourceLink";
import type { RecipeResponse } from "../types";
import { IngredientList } from "./IngredientList";
import { ServingsSelector } from "./ServingsSelector";

import classes from "./RecipeDetail.module.css";

type RecipeDetailProps = {
  recipe: RecipeResponse;
  onDelete: () => void;
  onCopy: () => void;
  onShare: () => void;
  isDeleting?: boolean;
  isCopying?: boolean;
  justCopied?: boolean;
  sharedWith?: string[];
  errorCode?: AppErrorCode | undefined;
  photoSrc?: (photoId: string) => string;
  servings?: number | undefined;
  onServingsChange?: (servings: number) => void;
  onStartCooking?: () => void;
};

const NOBODY: string[] = [];

const defaultPhotoSrc = (photoId: string) => photoUrl(photoId, "full");

export function RecipeDetail({
  recipe,
  onDelete,
  onCopy,
  onShare,
  isDeleting = false,
  isCopying = false,
  justCopied = false,
  sharedWith = NOBODY,
  errorCode,
  photoSrc = defaultPhotoSrc,
  servings: controlledServings,
  onServingsChange,
  onStartCooking,
}: RecipeDetailProps) {
  const { t, i18n } = useTranslation("recipes");
  const formatDuration = useFormatDuration();
  const label = useTagLabel();
  const [confirming, setConfirming] = useState(false);
  const [servings, setServings] = useUncontrolled({
    ...(controlledServings === undefined ? {} : { value: controlledServings }),
    ...(onServingsChange === undefined ? {} : { onChange: onServingsChange }),
    defaultValue: recipe.servings,
    finalValue: recipe.servings,
  });
  const times = [
    recipe.prep_minutes
      ? t("detail.prep", { duration: formatDuration(recipe.prep_minutes * 60) })
      : null,
    recipe.cook_minutes
      ? t("detail.cook", { duration: formatDuration(recipe.cook_minutes * 60) })
      : null,
  ].filter((part) => part !== null);
  const sourceName = recipe.source_url === null ? null : sourceHost(recipe.source_url);

  return (
    <Stack gap="lg">
      {recipe.cover_photo_id !== null && (
        <FullBleed>
          <AspectRatio ratio={16 / 10}>
            <Image
              src={photoSrc(recipe.cover_photo_id)}
              alt={t("detail.coverAlt", { title: recipe.title })}
              radius={0}
              fit="cover"
            />
          </AspectRatio>
        </FullBleed>
      )}
      <Stack gap="xs">
        <HandwrittenTitle>{recipe.title}</HandwrittenTitle>
        {times.length > 0 && <Text c="dimmed">{times.join(" · ")}</Text>}
        {recipe.tags.length > 0 && (
          <Group gap="xs" aria-label={t("detail.tags")}>
            {recipe.tags.map((tag) => (
              <Badge key={tag.id} tt="none">
                {label(tag)}
              </Badge>
            ))}
          </Group>
        )}
        {recipe.source_url !== null && sourceName !== null && (
          <Text c="dimmed">
            {t("detail.source")}{" "}
            <Anchor href={recipe.source_url} target="_blank" rel="noopener noreferrer">
              {sourceName}
            </Anchor>
          </Text>
        )}
      </Stack>
      <ButtonLink
        to="/recipes/$recipeId/cook"
        params={{ recipeId: recipe.id }}
        search={{ step: 1, servings }}
        onClick={onStartCooking}
        leftSection={<ChefIcon />}
      >
        {t("detail.startCooking")}
      </ButtonLink>
      {justCopied && <SuccessMessage title={t("detail.copied")} />}
      {!recipe.is_own && (
        <InfoMessage title={t("detail.sharedWithMe", { name: recipe.author.display_name })} />
      )}
      <FormError code={errorCode} />
      {recipe.is_own ? (
        <Stack gap="xs">
          <SimpleGrid cols={2} spacing="sm">
            <ButtonLink
              to="/recipes/$recipeId/edit"
              params={{ recipeId: recipe.id }}
              variant="default"
            >
              {t("detail.edit")}
            </ButtonLink>
            <Button variant="default" onClick={onShare} leftSection={<ShareIcon />}>
              {t("detail.share")}
            </Button>
          </SimpleGrid>
          <Button
            variant="subtle"
            color="ink"
            onClick={() => setConfirming(true)}
            loading={isDeleting}
          >
            {t("detail.delete")}
          </Button>
          {sharedWith.length > 0 && (
            <Text size="sm" c="dimmed">
              {t("detail.sharedWith", { names: formatList(sharedWith, i18n.language) })}
            </Text>
          )}
        </Stack>
      ) : (
        <Button variant="outline" color="tomato" onClick={onCopy} loading={isCopying}>
          {t("detail.copy")}
        </Button>
      )}

      <Stack gap="xs">
        <SectionTitle>{t("detail.ingredients")}</SectionTitle>
        <ServingsSelector value={servings} original={recipe.servings} onChange={setServings} />
        <IngredientList
          ingredients={recipe.ingredients}
          originalServings={recipe.servings}
          servings={servings}
        />
      </Stack>

      <Stack gap="xs">
        <SectionTitle>{t("detail.steps")}</SectionTitle>
        <List type="ordered" spacing="md" aria-label={t("detail.steps")}>
          {recipe.steps.map((step, index) => (
            <List.Item key={step.id}>
              <Text className={classes.stepText}>{step.text}</Text>
              {step.photo_id !== null && (
                <Image
                  src={photoSrc(step.photo_id)}
                  alt={t("detail.stepPhotoAlt", { number: index + 1 })}
                  radius="md"
                  mt="xs"
                  mah={280}
                  fit="cover"
                />
              )}
              {step.timer_seconds !== null && (
                <Text size="sm" c="dimmed">
                  {t("detail.timer", { duration: formatDuration(step.timer_seconds) })}
                </Text>
              )}
            </List.Item>
          ))}
        </List>
      </Stack>

      {recipe.notes !== null && (
        <Stack gap="xs">
          <SectionTitle>{t("detail.notes")}</SectionTitle>
          <Text className={classes.notes}>{recipe.notes}</Text>
        </Stack>
      )}

      <ConfirmDialog
        opened={confirming}
        title={t("detail.deleteTitle", { title: recipe.title })}
        body={t("detail.deleteBody")}
        confirmLabel={t("detail.deleteConfirm")}
        onCancel={() => setConfirming(false)}
        onConfirm={() => {
          setConfirming(false);
          onDelete();
        }}
      />
    </Stack>
  );
}
