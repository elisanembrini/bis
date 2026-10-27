import { useTranslation } from "react-i18next";

import { ConfirmDialog } from "../../../components/ConfirmDialog";

type CookExitDialogProps = {
  opened: boolean;
  runningTimers: number;
  onCancel: () => void;
  onConfirm: () => void;
};

export function CookExitDialog({
  opened,
  runningTimers,
  onCancel,
  onConfirm,
}: CookExitDialogProps) {
  const { t } = useTranslation("cooking");

  return (
    <ConfirmDialog
      opened={opened}
      title={t("exitTitle")}
      body={t("exitBody", { count: runningTimers })}
      confirmLabel={t("exitConfirm")}
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  );
}
