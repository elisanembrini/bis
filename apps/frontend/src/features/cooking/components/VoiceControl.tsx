import { Badge, Box, Button, Group, Stack, Text } from "@mantine/core";
import { useTranslation } from "react-i18next";

import { MicrophoneIcon, MicrophoneOffIcon } from "../../../components/icons";
import { ErrorMessage, InfoMessage } from "../../../components/Messages";
import type { VoiceStatus } from "../hooks/useVoiceCommands";

type VoiceControlProps = {
  status: VoiceStatus;
  onEnable: () => void;
  onDisable: () => void;
};

export function VoiceControl({ status, onEnable, onDisable }: VoiceControlProps) {
  const { t } = useTranslation("cooking");

  if (status === "unsupported") {
    return <InfoMessage title={t("voice.unsupported")} />;
  }
  if (status === "denied") {
    return <ErrorMessage title={t("voice.denied")} />;
  }

  const active = status === "listening" || status === "paused" || status === "error";

  return (
    <Stack gap="xs">
      {active ? (
        <>
          <Box component="output">
            <Group gap="sm" wrap="nowrap">
              <Badge leftSection={<MicrophoneIcon size={16} />} tt="none">
                {t("voice.label")}
              </Badge>
              <Text size="sm">
                {status === "paused" ? t("voice.speaking") : t("voice.listening")}
              </Text>
            </Group>
          </Box>
          {status === "error" && <ErrorMessage title={t("voice.error")} />}
          <Button variant="default" leftSection={<MicrophoneOffIcon />} onClick={onDisable}>
            {t("voice.disable")}
          </Button>
        </>
      ) : (
        <Button variant="default" leftSection={<MicrophoneIcon />} onClick={onEnable}>
          {t("voice.enable")}
        </Button>
      )}
      <Text size="sm" c="dimmed">
        {t("voice.note")}
      </Text>
    </Stack>
  );
}
