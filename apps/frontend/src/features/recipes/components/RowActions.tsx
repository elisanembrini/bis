import { ActionIcon, Group } from "@mantine/core";
import { useTranslation } from "react-i18next";

import { ArrowDownIcon, ArrowUpIcon, CloseIcon } from "../../../components/icons";

type RowActionsProps = {
  isFirst: boolean;
  isLast: boolean;
  canRemove: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
};

export function RowActions({
  isFirst,
  isLast,
  canRemove,
  onMoveUp,
  onMoveDown,
  onRemove,
}: RowActionsProps) {
  const { t } = useTranslation("recipes");

  return (
    <Group gap="xs" justify="flex-end">
      <ActionIcon
        variant="default"
        size="xl"
        aria-label={t("editor.moveUp")}
        disabled={isFirst}
        onClick={onMoveUp}
      >
        <ArrowUpIcon />
      </ActionIcon>
      <ActionIcon
        variant="default"
        size="xl"
        aria-label={t("editor.moveDown")}
        disabled={isLast}
        onClick={onMoveDown}
      >
        <ArrowDownIcon />
      </ActionIcon>
      <ActionIcon
        variant="light"
        color="red"
        size="xl"
        aria-label={t("editor.remove")}
        disabled={!canRemove}
        onClick={onRemove}
      >
        <CloseIcon />
      </ActionIcon>
    </Group>
  );
}
