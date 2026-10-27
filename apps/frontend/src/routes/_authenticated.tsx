import { createFileRoute } from "@tanstack/react-router";

import { AuthenticatedLayout } from "../features/auth/components/AuthenticatedLayout";
import { requireAuthentication } from "../features/auth/guard";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async ({ context, location }) => ({
    me: await requireAuthentication(context.queryClient, location.href),
  }),
  component: AuthenticatedLayout,
});
