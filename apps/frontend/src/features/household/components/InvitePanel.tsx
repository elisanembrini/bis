import { Button, CopyButton, Group, Stack, Text, TextInput, Title } from "@mantine/core";
import { useTranslation } from "react-i18next";

import type { AppErrorCode } from "../../../api/errors";
import { FormError } from "../../../components/FormError";
import { formatDate } from "../formatDate";
import type { InviteCreated } from "../types";

type InvitePanelProps = {
  onGenerate: () => void;
  isGenerating?: boolean;
  invite?: InviteCreated | undefined;
  errorCode?: AppErrorCode | undefined;
};

export function InvitePanel({
  onGenerate,
  isGenerating = false,
  invite,
  errorCode,
}: InvitePanelProps) {
  const { t } = useTranslation("household");

  return (
    <Stack gap="sm">
      <Title order={2} size="h3">
        {t("invite.title")}
      </Title>
      <Text size="sm">{t("invite.description")}</Text>
      <FormError code={errorCode} />
      {invite !== undefined && (
        <Stack gap="xs">
          <Group align="flex-end" wrap="nowrap">
            <TextInput
              label={t("invite.linkLabel")}
              value={invite.url}
              readOnly
              flex={1}
              onFocus={(event) => event.currentTarget.select()}
            />
            <CopyButton value={invite.url}>
              {({ copied, copy }) => (
                <Button
                  variant={copied ? "filled" : "light"}
                  color={copied ? "teal" : "orange"}
                  onClick={copy}
                >
                  {copied ? t("invite.copied") : t("invite.copy")}
                </Button>
              )}
            </CopyButton>
          </Group>
          <Text size="sm" c="dimmed">
            {t("invite.expires", { date: formatDate(invite.expires_at) })}
          </Text>
        </Stack>
      )}
      <Button
        variant={invite === undefined ? "filled" : "default"}
        onClick={onGenerate}
        loading={isGenerating}
      >
        {invite === undefined ? t("invite.generate") : t("invite.generateAnother")}
      </Button>
    </Stack>
  );
}
