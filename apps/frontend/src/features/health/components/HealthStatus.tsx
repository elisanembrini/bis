import { Box, Group, Loader, Stack, Title } from "@mantine/core";
import { useTranslation } from "react-i18next";

import { ErrorMessage, SuccessMessage } from "../../../components/Messages";
import type { HealthState } from "../healthState";

type HealthStatusProps = {
  state: HealthState;
};

export function HealthStatus({ state }: HealthStatusProps) {
  const { t } = useTranslation("health");

  return (
    <Stack gap="md">
      <Title order={1}>{t("title")}</Title>
      <Box component="output" aria-live="polite">
        {state === "loading" && (
          <Group gap="xs">
            <Loader aria-hidden />
            {t("status.loading")}
          </Group>
        )}
        {state === "ok" && <SuccessMessage title={t("status.ok")} />}
        {state === "error" && <ErrorMessage title={t("status.error")} />}
      </Box>
    </Stack>
  );
}
