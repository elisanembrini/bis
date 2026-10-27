import { Button, Group, Modal, Stack, Text } from "@mantine/core";
import { useTranslation } from "react-i18next";

type ConfirmDialogProps = {
  opened: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  isConfirming?: boolean;
};

export function ConfirmDialog({
  opened,
  title,
  body,
  confirmLabel,
  onConfirm,
  onCancel,
  isConfirming = false,
}: ConfirmDialogProps) {
  const { t } = useTranslation();

  return (
    <Modal opened={opened} onClose={onCancel} title={title} centered>
      <Stack gap="lg">
        <Text>{body}</Text>
        <Group justify="flex-end">
          <Button variant="default" onClick={onCancel} disabled={isConfirming}>
            {t("actions.cancel")}
          </Button>
          <Button color="red" onClick={onConfirm} loading={isConfirming}>
            {confirmLabel}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
