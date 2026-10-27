import { AspectRatio, Button, Group, Image, Stack, Text } from "@mantine/core";
import { useTranslation } from "react-i18next";

import { ClockIcon } from "../../../components/icons";
import { formatClock } from "../timers";

import classes from "./CookStep.module.css";

export type StepTimerState = "none" | "ready" | "running" | "finished";

type CookStepProps = {
  number: number;
  total: number;
  text: string;
  photoSrc?: string | undefined;
  timerSeconds: number | null;
  timerState: StepTimerState;
  onStartTimer: () => void;
};

export function CookStep({
  number,
  total,
  text,
  photoSrc,
  timerSeconds,
  timerState,
  onStartTimer,
}: CookStepProps) {
  const { t } = useTranslation("cooking");

  return (
    <Stack gap="lg">
      <Group gap="xs" align="baseline">
        <span className={classes.number} aria-hidden="true">
          {number}
        </span>
        <Text c="dimmed" aria-hidden="true">
          {t("stepNumberOf", { total })}
        </Text>
      </Group>
      <Text className={classes.text}>{text}</Text>
      {photoSrc !== undefined && (
        <AspectRatio ratio={16 / 10}>
          <Image src={photoSrc} alt={t("photoAlt", { number })} fit="cover" />
        </AspectRatio>
      )}
      {timerSeconds !== null && (
        <Button
          variant="outline"
          leftSection={<ClockIcon size={28} />}
          onClick={onStartTimer}
          disabled={timerState === "running"}
          h={64}
        >
          {timerState === "running"
            ? t("timerRunning")
            : t("startTimer", { time: formatClock(timerSeconds * 1000) })}
        </Button>
      )}
    </Stack>
  );
}
