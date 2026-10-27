import { ActionIcon, Badge, Group, Paper, Stack, Text } from "@mantine/core";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import type { AppErrorCode } from "../../../api/errors";
import { ConfirmDialog } from "../../../components/ConfirmDialog";
import { FormError } from "../../../components/FormError";
import { CloseIcon } from "../../../components/icons";
import { PlainList } from "../../../components/PlainList";
import { SectionTitle } from "../../../components/SectionTitle";
import type { HouseholdMember } from "../types";

type MemberListProps = {
  members: HouseholdMember[];
  currentUserId: string;
  canRemove: boolean;
  onRemove: (member: HouseholdMember) => void;
  removingUserId?: string | undefined;
  errorCode?: AppErrorCode | undefined;
};

export function MemberList({
  members,
  currentUserId,
  canRemove,
  onRemove,
  removingUserId,
  errorCode,
}: MemberListProps) {
  const { t } = useTranslation("household");
  const [pending, setPending] = useState<HouseholdMember | null>(null);

  return (
    <Stack gap="sm">
      <SectionTitle>{t("members.title")}</SectionTitle>
      <FormError code={errorCode} />
      <PlainList label={t("members.title")}>
        {members.map((member) => {
          const isCurrentUser = member.user_id === currentUserId;
          return (
            <li key={member.user_id}>
              <Paper withBorder p="sm">
                <Group justify="space-between" wrap="nowrap">
                  <Group gap="xs">
                    <Text fw={500}>{member.display_name}</Text>
                    {isCurrentUser && (
                      <Text c="dimmed" size="sm">
                        ({t("members.you")})
                      </Text>
                    )}
                    <Badge tt="none" variant={member.role === "owner" ? "light" : "outline"}>
                      {t(`roles.${member.role}`)}
                    </Badge>
                  </Group>
                  {canRemove && !isCurrentUser && (
                    <ActionIcon
                      variant="default"
                      aria-label={t("members.removeAria", { name: member.display_name })}
                      loading={removingUserId === member.user_id}
                      onClick={() => setPending(member)}
                    >
                      <CloseIcon />
                    </ActionIcon>
                  )}
                </Group>
              </Paper>
            </li>
          );
        })}
      </PlainList>
      <ConfirmDialog
        opened={pending !== null}
        title={t("members.removeTitle", { name: pending?.display_name ?? "" })}
        body={t("members.removeBody", { name: pending?.display_name ?? "" })}
        confirmLabel={t("members.removeConfirm")}
        onCancel={() => setPending(null)}
        onConfirm={() => {
          if (pending !== null) {
            onRemove(pending);
          }
          setPending(null);
        }}
      />
    </Stack>
  );
}
