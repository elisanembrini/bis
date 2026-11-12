import {
  Button,
  Fieldset,
  Group,
  NativeSelect,
  Stack,
  TextInput,
  Textarea,
  Title,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import type { AppErrorCode } from "../../../api/errors";
import { FormError } from "../../../components/FormError";
import { PlusIcon } from "../../../components/icons";
import { ErrorMessage, InfoMessage } from "../../../components/Messages";
import { SectionTitle } from "../../../components/SectionTitle";
import { formatDate } from "../../../i18n/formatDate";
import { TagPicker } from "../../tags/components/TagPicker";
import type { TagResponse } from "../../tags/types";
import type { RecipeDraft } from "../draft";
import {
  type RecipeFormValues,
  emptyIngredient,
  emptyStep,
  formToRecipeInput,
  validateRecipeForm,
} from "../form";
import { type RecipeInput, UNITS } from "../types";
import { PhotoField } from "./PhotoField";
import { RowActions } from "./RowActions";

type RecipeEditorProps = {
  heading: string;
  initialValues: RecipeFormValues;
  availableTags: TagResponse[];
  newKey: () => string;
  onSubmit: (recipe: RecipeInput) => void;
  onCancel: () => void;
  onChange?: (values: RecipeFormValues) => void;
  pendingDraft?: RecipeDraft | undefined;
  onRestoreDraft?: () => void;
  onDiscardDraft?: () => void;
  isSubmitting?: boolean;
  errorCode?: AppErrorCode | undefined;
};

export function RecipeEditor({
  heading,
  initialValues,
  availableTags,
  newKey,
  onSubmit,
  onCancel,
  onChange,
  pendingDraft,
  onRestoreDraft,
  onDiscardDraft,
  isSubmitting = false,
  errorCode,
}: RecipeEditorProps) {
  const { t } = useTranslation("recipes");
  const form = useForm<RecipeFormValues>({
    initialValues,
    validate: (values) =>
      Object.fromEntries(
        Object.entries(validateRecipeForm(values)).map(([field, key]) => [
          field,
          t(`editor.errors.${key}`),
        ]),
      ),
    onValuesChange: (values) => onChange?.(values),
  });
  const unitOptions = [
    { value: "", label: t("editor.noUnit") },
    ...UNITS.map((unit) => ({ value: unit, label: t(`units.${unit}`, { count: 1 }) })),
  ];
  const { ingredients, steps, coverPhotoId, tagIds } = form.getValues();
  const [uploads, setUploads] = useState<Record<string, boolean>>({});
  const isUploading = Object.values(uploads).some(Boolean);
  const trackUpload = (field: string) => (uploading: boolean) =>
    setUploads((current) => ({ ...current, [field]: uploading }));

  return (
    <form noValidate onSubmit={form.onSubmit((values) => onSubmit(formToRecipeInput(values)))}>
      <Stack gap="lg">
        <Title order={1}>{heading}</Title>
        {pendingDraft !== undefined && (
          <InfoMessage title={t("editor.draftFound", { date: formatDate(pendingDraft.savedAt) })}>
            <Group gap="sm" mt="xs">
              <Button
                onClick={() => {
                  form.setValues(pendingDraft.values);
                  onRestoreDraft?.();
                }}
              >
                {t("editor.restoreDraft")}
              </Button>
              <Button variant="default" onClick={() => onDiscardDraft?.()}>
                {t("editor.discardDraft")}
              </Button>
            </Group>
          </InfoMessage>
        )}
        <FormError code={errorCode} />

        <TextInput
          label={t("editor.title")}
          key={form.key("title")}
          {...form.getInputProps("title")}
        />
        <PhotoField
          label={t("editor.coverPhoto")}
          photoId={coverPhotoId}
          onChange={(photoId) => form.setFieldValue("coverPhotoId", photoId)}
          onUploadingChange={trackUpload("cover")}
          disabled={isSubmitting}
        />
        <Group grow align="flex-start">
          <TextInput
            label={t("editor.servings")}
            inputMode="numeric"
            key={form.key("servings")}
            {...form.getInputProps("servings")}
          />
          <TextInput
            label={t("editor.prepMinutes")}
            inputMode="numeric"
            key={form.key("prepMinutes")}
            {...form.getInputProps("prepMinutes")}
          />
          <TextInput
            label={t("editor.cookMinutes")}
            inputMode="numeric"
            key={form.key("cookMinutes")}
            {...form.getInputProps("cookMinutes")}
          />
        </Group>

        <Stack gap="sm">
          <SectionTitle>{t("editor.ingredients")}</SectionTitle>
          {typeof form.errors["ingredients"] === "string" && (
            <ErrorMessage title={form.errors["ingredients"]} />
          )}
          {ingredients.map((ingredient, index) => (
            <Fieldset
              key={ingredient.key}
              legend={t("editor.ingredientLegend", { number: index + 1 })}
            >
              <Stack gap="xs">
                <Group grow align="flex-start" wrap="nowrap">
                  <TextInput
                    label={t("editor.quantity")}
                    description={t("editor.quantityHint")}
                    inputMode="decimal"
                    key={form.key(`ingredients.${index}.quantity`)}
                    {...form.getInputProps(`ingredients.${index}.quantity`)}
                  />
                  <NativeSelect
                    label={t("editor.unit")}
                    data={unitOptions}
                    key={form.key(`ingredients.${index}.unit`)}
                    {...form.getInputProps(`ingredients.${index}.unit`)}
                  />
                </Group>
                <TextInput
                  label={t("editor.ingredientName")}
                  key={form.key(`ingredients.${index}.name`)}
                  {...form.getInputProps(`ingredients.${index}.name`)}
                />
                <RowActions
                  isFirst={index === 0}
                  isLast={index === ingredients.length - 1}
                  canRemove={ingredients.length > 1}
                  onMoveUp={() =>
                    form.reorderListItem("ingredients", { from: index, to: index - 1 })
                  }
                  onMoveDown={() =>
                    form.reorderListItem("ingredients", { from: index, to: index + 1 })
                  }
                  onRemove={() => form.removeListItem("ingredients", index)}
                />
              </Stack>
            </Fieldset>
          ))}
          <Button
            variant="light"
            leftSection={<PlusIcon />}
            onClick={() => form.insertListItem("ingredients", emptyIngredient(newKey()))}
          >
            {t("editor.addIngredient")}
          </Button>
        </Stack>

        <Stack gap="sm">
          <SectionTitle>{t("editor.steps")}</SectionTitle>
          {typeof form.errors["steps"] === "string" && (
            <ErrorMessage title={form.errors["steps"]} />
          )}
          {steps.map((step, index) => (
            <Fieldset key={step.key} legend={t("editor.stepLegend", { number: index + 1 })}>
              <Stack gap="xs">
                <Textarea
                  label={t("editor.stepText")}
                  autosize
                  minRows={2}
                  key={form.key(`steps.${index}.text`)}
                  {...form.getInputProps(`steps.${index}.text`)}
                />
                <Group grow align="flex-start" wrap="nowrap">
                  <TextInput
                    label={t("editor.timerMinutes")}
                    inputMode="numeric"
                    key={form.key(`steps.${index}.timerMinutes`)}
                    {...form.getInputProps(`steps.${index}.timerMinutes`)}
                  />
                  <TextInput
                    label={t("editor.timerSeconds")}
                    inputMode="numeric"
                    key={form.key(`steps.${index}.timerSeconds`)}
                    {...form.getInputProps(`steps.${index}.timerSeconds`)}
                  />
                </Group>
                <PhotoField
                  label={t("editor.stepPhoto", { number: index + 1 })}
                  photoId={step.photoId}
                  onChange={(photoId) => form.setFieldValue(`steps.${index}.photoId`, photoId)}
                  onUploadingChange={trackUpload(step.key)}
                  disabled={isSubmitting}
                />
                <RowActions
                  isFirst={index === 0}
                  isLast={index === steps.length - 1}
                  canRemove={steps.length > 1}
                  onMoveUp={() => form.reorderListItem("steps", { from: index, to: index - 1 })}
                  onMoveDown={() => form.reorderListItem("steps", { from: index, to: index + 1 })}
                  onRemove={() => form.removeListItem("steps", index)}
                />
              </Stack>
            </Fieldset>
          ))}
          <Button
            variant="light"
            leftSection={<PlusIcon />}
            onClick={() => form.insertListItem("steps", emptyStep(newKey()))}
          >
            {t("editor.addStep")}
          </Button>
        </Stack>

        <TagPicker
          tags={availableTags}
          value={tagIds}
          onChange={(selected) => form.setFieldValue("tagIds", selected)}
        />

        <TextInput
          label={t("editor.sourceUrl")}
          type="url"
          inputMode="url"
          key={form.key("sourceUrl")}
          {...form.getInputProps("sourceUrl")}
        />

        <Textarea
          label={t("editor.notes")}
          autosize
          minRows={2}
          key={form.key("notes")}
          {...form.getInputProps("notes")}
        />

        <Group grow>
          <Button variant="default" onClick={onCancel} disabled={isSubmitting}>
            {t("editor.cancel")}
          </Button>
          <Button type="submit" loading={isSubmitting} disabled={isUploading}>
            {t("editor.save")}
          </Button>
        </Group>
      </Stack>
    </form>
  );
}
