import { Button, Stack } from "@mantine/core";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import type { AppErrorCode } from "../../../api/errors";
import { ConfirmDialog } from "../../../components/ConfirmDialog";
import { FormError } from "../../../components/FormError";

type LeaveHouseholdButtonProps = {
  onLeave: () => void;
  isLeaving?: boolean;
  errorCode?: AppErrorCode | undefined;
};

export function LeaveHouseholdButton({
  onLeave,
  isLeaving = false,
  errorCode,
}: LeaveHouseholdButtonProps) {
  const { t } = useTranslation("household");
  const [confirming, setConfirming] = useState(false);

  return (
    <Stack gap="sm">
      <FormError code={errorCode} />
      <Button color="red" variant="light" onClick={() => setConfirming(true)} loading={isLeaving}>
        {t("leave.button")}
      </Button>
      <ConfirmDialog
        opened={confirming}
        title={t("leave.title")}
        body={t("leave.body")}
        confirmLabel={t("leave.confirm")}
        onCancel={() => setConfirming(false)}
        onConfirm={() => {
          setConfirming(false);
          onLeave();
        }}
      />
    </Stack>
  );
}
