import { Button, Group, List, Stack, Text, Title } from "@mantine/core";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import type { AppErrorCode } from "../../../api/errors";
import { ButtonLink } from "../../../components/ButtonLink";
import { ConfirmDialog } from "../../../components/ConfirmDialog";
import { FormError } from "../../../components/FormError";
import { useFormatDuration } from "../hooks/useFormatDuration";
import { useFormatAmount } from "../hooks/useFormatIngredient";
import type { RecipeResponse } from "../types";

import classes from "./RecipeDetail.module.css";

type RecipeDetailProps = {
  recipe: RecipeResponse;
  onDelete: () => void;
  isDeleting?: boolean;
  errorCode?: AppErrorCode | undefined;
};

export function RecipeDetail({
  recipe,
  onDelete,
  isDeleting = false,
  errorCode,
}: RecipeDetailProps) {
  const { t } = useTranslation("recipes");
  const formatDuration = useFormatDuration();
  const formatAmount = useFormatAmount();
  const [confirming, setConfirming] = useState(false);

  return (
    <Stack gap="lg">
      <Stack gap={4}>
        <Title order={1}>{recipe.title}</Title>
        <Text c="dimmed">
          {[
            t("detail.servings", { count: recipe.servings }),
            recipe.prep_minutes
              ? t("detail.prep", { duration: formatDuration(recipe.prep_minutes * 60) })
              : null,
            recipe.cook_minutes
              ? t("detail.cook", { duration: formatDuration(recipe.cook_minutes * 60) })
              : null,
          ]
            .filter((part) => part !== null)
            .join(" · ")}
        </Text>
      </Stack>
      <FormError code={errorCode} />
      <Group grow>
        <ButtonLink to="/recipes/$recipeId/edit" params={{ recipeId: recipe.id }} variant="default">
          {t("detail.edit")}
        </ButtonLink>
        <Button
          color="red"
          variant="light"
          onClick={() => setConfirming(true)}
          loading={isDeleting}
        >
          {t("detail.delete")}
        </Button>
      </Group>

      <Stack gap="xs">
        <Title order={2} size="h3">
          {t("detail.ingredients")}
        </Title>
        <List spacing="xs" aria-label={t("detail.ingredients")}>
          {recipe.ingredients.map((ingredient) => (
            <List.Item key={ingredient.id}>
              <Text span fw={600}>
                {formatAmount(ingredient)}
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
          {recipe.steps.map((step) => (
            <List.Item key={step.id}>
              <Text>{step.text}</Text>
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
