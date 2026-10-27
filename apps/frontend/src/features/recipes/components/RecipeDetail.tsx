import { Alert, Badge, Button, Group, Image, List, Stack, Text, Title } from "@mantine/core";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import type { AppErrorCode } from "../../../api/errors";
import { photoUrl } from "../../../api/photos";
import { ButtonLink } from "../../../components/ButtonLink";
import { ConfirmDialog } from "../../../components/ConfirmDialog";
import { FormError } from "../../../components/FormError";
import { useFormatDuration } from "../hooks/useFormatDuration";
import { useFormatAmount } from "../hooks/useFormatIngredient";
import { scaleQuantity } from "../servings";
import type { RecipeResponse } from "../types";
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
};

const NOBODY: string[] = [];

const listFormatter = new Intl.ListFormat("it-IT", { style: "long", type: "conjunction" });

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
}: RecipeDetailProps) {
  const { t } = useTranslation("recipes");
  const formatDuration = useFormatDuration();
  const formatAmount = useFormatAmount();
  const [confirming, setConfirming] = useState(false);
  const [servings, setServings] = useState(recipe.servings);
  const times = [
    recipe.prep_minutes
      ? t("detail.prep", { duration: formatDuration(recipe.prep_minutes * 60) })
      : null,
    recipe.cook_minutes
      ? t("detail.cook", { duration: formatDuration(recipe.cook_minutes * 60) })
      : null,
  ].filter((part) => part !== null);

  return (
    <Stack gap="lg">
      {recipe.cover_photo_id !== null && (
        <Image
          src={photoSrc(recipe.cover_photo_id)}
          alt={t("detail.coverAlt", { title: recipe.title })}
          radius="md"
          mah={420}
          fit="cover"
        />
      )}
      <Stack gap="xs">
        <Title order={1}>{recipe.title}</Title>
        {times.length > 0 && <Text c="dimmed">{times.join(" · ")}</Text>}
        {recipe.tags.length > 0 && (
          <Group gap="xs" aria-label={t("detail.tags")}>
            {recipe.tags.map((tag) => (
              <Badge key={tag.id} variant="light">
                {tag.name}
              </Badge>
            ))}
          </Group>
        )}
      </Stack>
      {justCopied && <Alert color="green" title={t("detail.copied")} />}
      {!recipe.is_own && (
        <Alert
          color="orange"
          title={t("detail.sharedWithMe", { name: recipe.author.display_name })}
        />
      )}
      <FormError code={errorCode} />
      {recipe.is_own ? (
        <Stack gap="xs">
          <Group grow>
            <ButtonLink
              to="/recipes/$recipeId/edit"
              params={{ recipeId: recipe.id }}
              variant="default"
            >
              {t("detail.edit")}
            </ButtonLink>
            <Button variant="default" onClick={onShare}>
              {t("detail.share")}
            </Button>
            <Button
              color="red"
              variant="light"
              onClick={() => setConfirming(true)}
              loading={isDeleting}
            >
              {t("detail.delete")}
            </Button>
          </Group>
          {sharedWith.length > 0 && (
            <Text size="sm" c="dimmed">
              {t("detail.sharedWith", { names: listFormatter.format(sharedWith) })}
            </Text>
          )}
        </Stack>
      ) : (
        <Button onClick={onCopy} loading={isCopying} size="md">
          {t("detail.copy")}
        </Button>
      )}

      <Stack gap="xs">
        <Title order={2} size="h3">
          {t("detail.ingredients")}
        </Title>
        <ServingsSelector value={servings} original={recipe.servings} onChange={setServings} />
        <List spacing="xs" aria-label={t("detail.ingredients")}>
          {recipe.ingredients.map((ingredient) => (
            <List.Item key={ingredient.id}>
              <Text span fw={600}>
                {formatAmount({
                  quantity: scaleQuantity(
                    ingredient.quantity,
                    ingredient.unit,
                    recipe.servings,
                    servings,
                  ),
                  unit: ingredient.unit,
                })}
              </Text>{" "}
              {ingredient.name}
            </List.Item>
          ))}
        </List>
      </Stack>

      <Stack gap="xs">
        <Title order={2} size="h3">
          {t("detail.steps")}
        </Title>
        <List type="ordered" spacing="md" aria-label={t("detail.steps")}>
          {recipe.steps.map((step, index) => (
            <List.Item key={step.id}>
              <Text>{step.text}</Text>
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
          <Title order={2} size="h3">
            {t("detail.notes")}
          </Title>
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
