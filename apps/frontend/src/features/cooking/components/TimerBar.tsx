import { ActionIcon, Box, Button, Group, Paper, Stack, Text } from "@mantine/core";
import { useTranslation } from "react-i18next";

import { ClockIcon, CloseIcon } from "../../../components/icons";
import { type CookingTimer, formatClock, remainingMs } from "../timers";

type TimerBarProps = {
  timers: CookingTimer[];
  now: number;
  onCancel: (id: string) => void;
  onDismiss: (id: string) => void;
};

export function TimerBar({ timers, now, onCancel, onDismiss }: TimerBarProps) {
  const { t } = useTranslation("cooking");
  const finished = timers.filter((timer) => timer.status === "finished");
  const running = timers.filter((timer) => timer.status === "running");

  if (timers.length === 0) {
    return null;
  }

  return (
    <Box component="section" aria-label={t("timers")}>
      <Stack gap="xs">
        {finished.map((timer) => (
          <Paper key={timer.id} bg="tomato.8" c="white" p="md" role="alert">
            <Group justify="space-between" wrap="nowrap">
              <Group gap="sm" wrap="nowrap">
                <ClockIcon size={28} />
                <Text fw={700} fz="lg">
                  {t("timerFinished", { number: timer.stepIndex + 1 })}
                </Text>
              </Group>
              <Button variant="white" color="tomato.8" onClick={() => onDismiss(timer.id)}>
                {t("dismiss")}
              </Button>
            </Group>
          </Paper>
        ))}
        {running.map((timer) => (
          <Paper key={timer.id} bg="tomato.6" c="white" p="sm" pl="md">
            <Group justify="space-between" wrap="nowrap">
              <Group gap="sm" wrap="nowrap">
                <ClockIcon size={28} />
                <Text fw={600}>{t("timerLabel", { number: timer.stepIndex + 1 })}</Text>
                <Text fw={700} fz="xl" ff="monospace" aria-live="off">
                  {formatClock(remainingMs(timer, now))}
                </Text>
              </Group>
              <ActionIcon
                variant="transparent"
                c="white"
                aria-label={t("stopTimer", { number: timer.stepIndex + 1 })}
                onClick={() => onCancel(timer.id)}
              >
                <CloseIcon size={28} />
              </ActionIcon>
            </Group>
          </Paper>
        ))}
      </Stack>
    </Box>
  );
}
