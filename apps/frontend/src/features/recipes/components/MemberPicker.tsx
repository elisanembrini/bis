import { Button, Checkbox, Group, Stack, Text } from "@mantine/core";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import type { AppErrorCode } from "../../../api/errors";
import { AnchorLink } from "../../../components/AnchorLink";
import { FormError } from "../../../components/FormError";
import type { ShareCandidate } from "../types";

type MemberPickerProps = {
  candidates: ShareCandidate[];
  onSave: (userIds: string[]) => void;
  onCancel: () => void;
  isSaving?: boolean;
  errorCode?: AppErrorCode | undefined;
};

export function MemberPicker({
  candidates,
  onSave,
  onCancel,
  isSaving = false,
  errorCode,
}: MemberPickerProps) {
  const { t } = useTranslation("recipes");
  const [selected, setSelected] = useState(() =>
    candidates.filter((candidate) => candidate.shared).map((candidate) => candidate.user_id),
  );

  if (candidates.length === 0) {
    return (
      <Stack gap="sm">
        <Text>{t("share.noMembers")}</Text>
        <AnchorLink to="/household">{t("share.invite")}</AnchorLink>
      </Stack>
    );
  }

  return (
    <Stack gap="md">
      <Text size="sm">{t("share.description")}</Text>
      <FormError code={errorCode} />
      <Checkbox.Group value={selected} onChange={setSelected}>
        <Stack gap="sm">
          {candidates.map((candidate) => (
            <Checkbox
              key={candidate.user_id}
              value={candidate.user_id}
              label={candidate.display_name}
              size="md"
            />
          ))}
        </Stack>
      </Checkbox.Group>
      <Group justify="flex-end">
        <Button variant="default" onClick={onCancel} disabled={isSaving}>
          {t("share.cancel")}
        </Button>
        <Button onClick={() => onSave(selected)} loading={isSaving}>
          {t("share.save")}
        </Button>
      </Group>
    </Stack>
  );
}
