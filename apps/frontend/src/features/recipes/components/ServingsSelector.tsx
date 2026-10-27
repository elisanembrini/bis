import { ActionIcon, Button, Fieldset, Group, Stack, Text } from "@mantine/core";
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
      <Stack gap={4} align="flex-start">
        <Group gap="sm">
          <ActionIcon
            variant="default"
            size="xl"
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
            variant="default"
            size="xl"
            aria-label={t("servings.more")}
            disabled={value >= SERVINGS_MAX}
            onClick={() => onChange(value + 1)}
          >
            <PlusIcon />
          </ActionIcon>
        </Group>
        {value !== original && (
          <Button variant="subtle" size="compact-sm" onClick={() => onChange(original)}>
            {t("servings.reset", { count: original })}
          </Button>
        )}
      </Stack>
    </Fieldset>
  );
}
