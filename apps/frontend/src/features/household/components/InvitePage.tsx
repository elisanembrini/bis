import { Loader } from "@mantine/core";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useRouter } from "@tanstack/react-router";

import { $api } from "../../../api/client";
import { errorCodeOf } from "../../../api/errors";
import { meQueryOptions } from "../../auth/queries";
import { inviteState } from "../inviteState";
import { householdQueryOptions, invitePreviewQueryOptions } from "../queries";
import { InviteCard } from "./InviteCard";
import { InviteInvalid } from "./InviteInvalid";
import { InviteLayout } from "./InviteLayout";

type InvitePageProps = {
  token: string;
};

export function InvitePage({ token }: InvitePageProps) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const router = useRouter();
  const preview = useQuery(invitePreviewQueryOptions(token));
  const me = useQuery({ ...meQueryOptions(), retry: false });
  const household = useQuery({ ...householdQueryOptions(), enabled: me.isSuccess });
  const accept = $api.useMutation("post", "/household/invites/{token}/accept", {
    onSuccess: async (updatedMe) => {
      queryClient.setQueryData(meQueryOptions().queryKey, updatedMe);
      await queryClient.invalidateQueries({ queryKey: householdQueryOptions().queryKey });
      await navigate({ to: "/household" });
    },
  });

  if (preview.isError) {
    return (
      <InviteLayout>
        <InviteInvalid code={errorCodeOf(preview.error)} />
      </InviteLayout>
    );
  }
  if (preview.isPending || me.isPending || (me.isSuccess && household.isPending)) {
    return <Loader />;
  }

  return (
    <InviteLayout>
      <InviteCard
        token={token}
        inviterName={preview.data.inviter_display_name}
        state={inviteState({
          inviteHouseholdId: preview.data.household_id,
          currentHousehold: household.data,
        })}
        returnTo={router.buildLocation({ to: "/invite/$token", params: { token } }).href}
        onAccept={() => accept.mutate({ params: { path: { token } } })}
        isAccepting={accept.isPending}
        errorCode={accept.isError ? errorCodeOf(accept.error) : undefined}
      />
    </InviteLayout>
  );
}
