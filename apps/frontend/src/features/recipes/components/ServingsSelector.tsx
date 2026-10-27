import { ActionIcon, Button, Fieldset, Group, Paper, Stack, Text } from "@mantine/core";
import { useTranslation } from "react-i18next";

import { MinusIcon, PlusIcon } from "../../../components/icons";
import { SERVINGS_MAX, SERVINGS_MIN } from "../servings";

type ServingsSelectorProps = {
  value: number;
  original: number;
  onChange: (servings: number) => void;
};

export function ServingsSelector({ value, original, onChange }: ServingsSelectorProps) {
  const { t } = useTranslation("recipes");

  return (
    <Fieldset legend={t("servings.label")} variant="unstyled">
      <Stack gap="xs" align="flex-start">
        <Paper withBorder bg="white" p="xs">
          <Group gap="sm" wrap="nowrap">
            <ActionIcon
              aria-label={t("servings.less")}
              disabled={value <= SERVINGS_MIN}
              onClick={() => onChange(value - 1)}
            >
              <MinusIcon />
            </ActionIcon>
            <Text fw={600} miw={96} ta="center" aria-live="polite">
              {t("servings.value", { count: value })}
            </Text>
            <ActionIcon
              aria-label={t("servings.more")}
              disabled={value >= SERVINGS_MAX}
              onClick={() => onChange(value + 1)}
            >
              <PlusIcon />
            </ActionIcon>
          </Group>
        </Paper>
        {value !== original && (
          <Button variant="subtle" onClick={() => onChange(original)}>
            {t("servings.reset", { count: original })}
          </Button>
        )}
      </Stack>
    </Fieldset>
  );
}
