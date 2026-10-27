import {
  ActionIcon,
  Badge,
  Button,
  Group,
  List,
  Paper,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { isNotEmpty, useForm } from "@mantine/form";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import type { AppErrorCode } from "../../../api/errors";
import { ConfirmDialog } from "../../../components/ConfirmDialog";
import { FormError } from "../../../components/FormError";
import { CloseIcon } from "../../../components/icons";
import type { TagResponse } from "../types";

type TagManagerProps = {
  tags: TagResponse[];
  onCreate: (name: string) => void;
  onDelete: (tag: TagResponse) => void;
  isCreating?: boolean;
  deletingTagId?: string | undefined;
  errorCode?: AppErrorCode | undefined;
};

export function TagManager({
  tags,
  onCreate,
  onDelete,
  isCreating = false,
  deletingTagId,
  errorCode,
}: TagManagerProps) {
  const { t } = useTranslation("tags");
  const [pending, setPending] = useState<TagResponse | null>(null);
  const form = useForm({
    mode: "uncontrolled",
    initialValues: { name: "" },
    validate: { name: isNotEmpty(t("page.nameRequired")) },
  });
  const starterTags = tags.filter((tag) => !tag.is_own);
  const ownTags = tags.filter((tag) => tag.is_own);

  return (
    <Stack gap="xl">
      <Title order={1}>{t("page.title")}</Title>

      <form
        noValidate
        onSubmit={form.onSubmit(({ name }) => {
          onCreate(name.trim());
          form.reset();
        })}
      >
        <Stack gap="xs">
          <FormError code={errorCode} />
          <Group align="flex-end" wrap="nowrap">
            <TextInput
              label={t("page.newLabel")}
              maxLength={50}
              flex={1}
              key={form.key("name")}
              {...form.getInputProps("name")}
            />
            <Button type="submit" loading={isCreating}>
              {t("page.add")}
            </Button>
          </Group>
        </Stack>
      </form>

      <Stack gap="xs">
        <Title order={2} size="h3">
          {t("page.own")}
        </Title>
        {ownTags.length === 0 ? (
          <Text c="dimmed">{t("page.ownEmpty")}</Text>
        ) : (
          <List listStyleType="none" spacing="xs" p={0} m={0} aria-label={t("page.own")}>
            {ownTags.map((tag) => (
              <List.Item key={tag.id}>
                <Paper withBorder p="xs" pl="md">
                  <Group justify="space-between" wrap="nowrap">
                    <Text>{tag.name}</Text>
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      size="xl"
                      aria-label={t("page.deleteAria", { name: tag.name })}
                      loading={deletingTagId === tag.id}
                      onClick={() => setPending(tag)}
                    >
                      <CloseIcon />
                    </ActionIcon>
                  </Group>
                </Paper>
              </List.Item>
            ))}
          </List>
        )}
      </Stack>

      <Stack gap="xs">
        <Title order={2} size="h3">
          {t("page.starter")}
        </Title>
        <Text size="sm" c="dimmed">
          {t("page.starterHint")}
        </Text>
        <Group gap="xs">
          {starterTags.map((tag) => (
            <Badge key={tag.id} variant="light" size="lg">
              {tag.name}
            </Badge>
          ))}
        </Group>
      </Stack>

      <ConfirmDialog
        opened={pending !== null}
        title={t("page.deleteTitle", { name: pending?.name ?? "" })}
        body={t("page.deleteBody")}
        confirmLabel={t("page.deleteConfirm")}
        onCancel={() => setPending(null)}
        onConfirm={() => {
          if (pending !== null) {
            onDelete(pending);
          }
          setPending(null);
        }}
      />
    </Stack>
  );
}
