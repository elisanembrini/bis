import { createFileRoute } from "@tanstack/react-router";

import { errorCodeOf } from "../../api/errors";
import { InviteInvalid } from "../../features/household/components/InviteInvalid";
import { InviteLayout } from "../../features/household/components/InviteLayout";
import { InvitePage } from "../../features/household/components/InvitePage";
import { invitePreviewQueryOptions } from "../../features/household/queries";

export const Route = createFileRoute("/invite/$token")({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(invitePreviewQueryOptions(params.token)),
  component: InviteRoute,
  errorComponent: ({ error }) => (
    <InviteLayout>
      <InviteInvalid code={errorCodeOf(error)} />
    </InviteLayout>
  ),
});

function InviteRoute() {
  const { token } = Route.useParams();
  return <InvitePage token={token} />;
}
