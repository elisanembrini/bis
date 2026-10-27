import { ActionIcon, Badge, Group, List, Paper, Stack, Text, Title } from "@mantine/core";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import type { AppErrorCode } from "../../../api/errors";
import { ConfirmDialog } from "../../../components/ConfirmDialog";
import { FormError } from "../../../components/FormError";
import { CloseIcon } from "../../../components/icons";
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
      <Title order={2} size="h3">
        {t("members.title")}
      </Title>
      <FormError code={errorCode} />
      <List listStyleType="none" spacing="xs" p={0} m={0}>
        {members.map((member) => {
          const isCurrentUser = member.user_id === currentUserId;
          return (
            <List.Item key={member.user_id}>
              <Paper withBorder p="sm">
                <Group justify="space-between" wrap="nowrap">
                  <Group gap="xs">
                    <Text fw={500}>{member.display_name}</Text>
                    {isCurrentUser && (
                      <Text c="dimmed" size="sm">
                        ({t("members.you")})
                      </Text>
                    )}
                    <Badge variant="light" color={member.role === "owner" ? "orange" : "gray"}>
                      {t(`roles.${member.role}`)}
                    </Badge>
                  </Group>
                  {canRemove && !isCurrentUser && (
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      size="lg"
                      aria-label={t("members.removeAria", { name: member.display_name })}
                      loading={removingUserId === member.user_id}
                      onClick={() => setPending(member)}
                    >
                      <CloseIcon />
                    </ActionIcon>
                  )}
                </Group>
              </Paper>
            </List.Item>
          );
        })}
      </List>
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
