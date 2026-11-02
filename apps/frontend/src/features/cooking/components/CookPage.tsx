import { Box, Button, Container, Drawer, Group, Stack, Text } from "@mantine/core";
import { useBlocker } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { photoUrl } from "../../../api/photos";
import { ListIcon } from "../../../components/icons";
import { IngredientList } from "../../recipes/components/IngredientList";
import { ServingsSelector } from "../../recipes/components/ServingsSelector";
import type { RecipeResponse } from "../../recipes/types";
import { useNow } from "../hooks/useNow";
import { useTimerAlarms } from "../hooks/useTimerAlarms";
import { useVoiceCommands } from "../hooks/useVoiceCommands";
import { useWakeLock } from "../hooks/useWakeLock";
import { timerId } from "../timers";
import { timersOfRecipe, useTimersStore } from "../timersStore";
import { CookExitDialog } from "./CookExitDialog";
import { CookNavigation } from "./CookNavigation";
import { CookStep, type StepTimerState } from "./CookStep";
import { TimerBar } from "./TimerBar";
import { VoiceControl } from "./VoiceControl";

type CookPageProps = {
  recipe: RecipeResponse;
  step: number;
  servings: number;
  onStepChange: (step: number) => void;
  onServingsChange: (servings: number) => void;
  onExit: () => void;
};

const TICK_MS = 250;

export function CookPage({
  recipe,
  step,
  servings,
  onStepChange,
  onServingsChange,
  onExit,
}: CookPageProps) {
  const { t } = useTranslation("cooking");
  const [showIngredients, setShowIngredients] = useState(false);
  const now = useNow(TICK_MS);
  const allTimers = useTimersStore((state) => state.timers);
  const startTimer = useTimersStore((state) => state.start);
  const cancelTimer = useTimersStore((state) => state.cancel);
  const dismissTimer = useTimersStore((state) => state.dismiss);
  const clearRecipe = useTimersStore((state) => state.clearRecipe);
  const timers = timersOfRecipe(allTimers, recipe.id);
  const runningCount = timers.filter((timer) => timer.status === "running").length;
  const total = recipe.steps.length;
  const index = step - 1;
  const current = recipe.steps[index];

  useWakeLock(true);
  useTimerAlarms(now);

  const blocker = useBlocker({
    shouldBlockFn: ({ current: from, next }) => runningCount > 0 && from.pathname !== next.pathname,
    enableBeforeUnload: runningCount > 0,
    withResolver: true,
  });

  const goTo = (target: number) => onStepChange(Math.min(Math.max(target, 1), total));

  const startCurrentTimer = () => {
    if (current?.timer_seconds != null) {
      startTimer(recipe.id, index, current.timer_seconds * 1000);
    }
  };

  const voice = useVoiceCommands({
    onCommand: (command) => {
      if (command === "next") {
        goTo(step + 1);
      } else if (command === "previous") {
        goTo(step - 1);
      } else {
        startCurrentTimer();
      }
    },
    textToRepeat: () => current?.text,
  });

  const timerState = (): StepTimerState => {
    if (current?.timer_seconds == null) {
      return "none";
    }
    return allTimers[timerId(recipe.id, index)]?.status ?? "ready";
  };

  if (current === undefined) {
    return null;
  }

  return (
    <Container size="sm" px={{ base: 20, sm: 32 }} py="md">
      <Stack gap="lg">
        <Stack gap="xs">
          <Group justify="space-between" wrap="nowrap" align="flex-start">
            <Text fw={600} fz="lg" lh={1.3}>
              {recipe.title}
            </Text>
            <Button variant="subtle" color="ink" onClick={onExit}>
              {t("exit")}
            </Button>
          </Group>
          <Group justify="space-between" wrap="nowrap">
            <Text c="dimmed">{t("stepOf", { current: step, total })}</Text>
            <Button
              variant="default"
              leftSection={<ListIcon />}
              onClick={() => setShowIngredients(true)}
            >
              {t("ingredients")}
            </Button>
          </Group>
        </Stack>

        <Box pos="sticky" top={0} style={{ zIndex: 1 }}>
          <TimerBar timers={timers} now={now} onCancel={cancelTimer} onDismiss={dismissTimer} />
        </Box>

        <CookStep
          number={step}
          total={total}
          text={current.text}
          photoSrc={current.photo_id === null ? undefined : photoUrl(current.photo_id, "full")}
          timerSeconds={current.timer_seconds}
          timerState={timerState()}
          onStartTimer={startCurrentTimer}
        />

        <CookNavigation
          isFirst={step === 1}
          isLast={step === total}
          onPrevious={() => goTo(step - 1)}
          onNext={() => goTo(step + 1)}
          onFinish={onExit}
        />

        <VoiceControl status={voice.status} onEnable={voice.enable} onDisable={voice.disable} />
      </Stack>

      <Drawer
        opened={showIngredients}
        onClose={() => setShowIngredients(false)}
        position="bottom"
        title={t("ingredients")}
        size="75%"
      >
        <Stack gap="md" pb="md">
          <ServingsSelector
            value={servings}
            original={recipe.servings}
            onChange={onServingsChange}
          />
          <IngredientList
            ingredients={recipe.ingredients}
            originalServings={recipe.servings}
            servings={servings}
          />
        </Stack>
      </Drawer>

      <CookExitDialog
        opened={blocker.status === "blocked"}
        runningTimers={runningCount}
        onCancel={() => blocker.reset?.()}
        onConfirm={() => {
          clearRecipe(recipe.id);
          blocker.proceed?.();
        }}
      />
    </Container>
  );
}
