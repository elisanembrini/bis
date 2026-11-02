import { Button, Group, Paper, Stack, Text } from "@mantine/core";
import { useTranslation } from "react-i18next";

import type { InstallMode } from "../install";

type InstallBannerProps = {
  mode: InstallMode;
  onInstall: () => void;
  onDismiss: () => void;
};

export function InstallBanner({ mode, onInstall, onDismiss }: InstallBannerProps) {
  const { t } = useTranslation("pwa");

  return (
    <Paper component="section" aria-label={t("install.title")} withBorder p="md" radius="md">
      <Stack gap="xs">
        <Text fw={700}>{t("install.title")}</Text>
        <Text c="dimmed">{mode === "ios" ? t("install.ios") : t("install.description")}</Text>
        <Group gap="sm">
          {mode === "prompt" && (
            <Button color="ink" onClick={onInstall}>
              {t("install.button")}
            </Button>
          )}
          <Button variant="subtle" color="ink" onClick={onDismiss}>
            {t("install.dismiss")}
          </Button>
        </Group>
      </Stack>
    </Paper>
  );
}
