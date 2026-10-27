import { Loader, Modal } from "@mantine/core";
import { useTranslation } from "react-i18next";

import type { AppErrorCode } from "../../../api/errors";
import { FormError } from "../../../components/FormError";
import type { ShareCandidate } from "../types";
import { MemberPicker } from "./MemberPicker";

type ShareDialogProps = {
  opened: boolean;
  recipeTitle: string;
  candidates: ShareCandidate[] | undefined;
  loadErrorCode?: AppErrorCode | undefined;
  onSave: (userIds: string[]) => void;
  onClose: () => void;
  isSaving?: boolean;
  saveErrorCode?: AppErrorCode | undefined;
};

export function ShareDialog({
  opened,
  recipeTitle,
  candidates,
  loadErrorCode,
  onSave,
  onClose,
  isSaving = false,
  saveErrorCode,
}: ShareDialogProps) {
  const { t } = useTranslation("recipes");

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={t("share.title", { title: recipeTitle })}
      centered
    >
      {loadErrorCode !== undefined && <FormError code={loadErrorCode} />}
      {candidates === undefined && loadErrorCode === undefined && <Loader />}
      {candidates !== undefined && (
        <MemberPicker
          candidates={candidates}
          onSave={onSave}
          onCancel={onClose}
          isSaving={isSaving}
          errorCode={saveErrorCode}
        />
      )}
    </Modal>
  );
}
