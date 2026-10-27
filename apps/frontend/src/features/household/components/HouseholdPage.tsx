import { Divider, Loader, Stack, Title } from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { errorCodeOf } from "../../../api/errors";
import { FormError } from "../../../components/FormError";
import { PageContainer } from "../../../components/PageContainer";
import { useMe } from "../../auth/hooks/useMe";
import { useHouseholdMutations } from "../hooks/useHouseholdMutations";
import { householdQueryOptions } from "../queries";
import { InvitePanel } from "./InvitePanel";
import { LeaveHouseholdButton } from "./LeaveHouseholdButton";
import { MemberList } from "./MemberList";

export function HouseholdPage() {
  const { t } = useTranslation("household");
  const me = useMe();
  const household = useQuery(householdQueryOptions());
  const { createInvite, removeMember, leave } = useHouseholdMutations();

  if (household.isPending || me.isPending) {
    return <Loader />;
  }
  if (household.isError || me.isError) {
    return <FormError code={errorCodeOf(household.error ?? me.error)} />;
  }

  const isOwner = household.data.role === "owner";

  return (
    <PageContainer>
      <Stack gap="xl">
        <Title order={1}>{t("title")}</Title>
        <MemberList
          members={household.data.members}
          currentUserId={me.data.id}
          canRemove={isOwner}
          onRemove={(member) =>
            removeMember.mutate({ params: { path: { user_id: member.user_id } } })
          }
          removingUserId={
            removeMember.isPending ? removeMember.variables.params.path.user_id : undefined
          }
          errorCode={removeMember.isError ? errorCodeOf(removeMember.error) : undefined}
        />
        {isOwner && (
          <>
            <Divider />
            <InvitePanel
              onGenerate={() => createInvite.mutate({})}
              isGenerating={createInvite.isPending}
              invite={createInvite.data}
              errorCode={createInvite.isError ? errorCodeOf(createInvite.error) : undefined}
            />
          </>
        )}
        {!isOwner && (
          <>
            <Divider />
            <LeaveHouseholdButton
              onLeave={() => leave.mutate({})}
              isLeaving={leave.isPending}
              errorCode={leave.isError ? errorCodeOf(leave.error) : undefined}
            />
          </>
        )}
      </Stack>
    </PageContainer>
  );
}
