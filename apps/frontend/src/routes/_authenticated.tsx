import { createFileRoute } from "@tanstack/react-router";

import { AuthenticatedLayout } from "../features/auth/components/AuthenticatedLayout";
import { requireAuthentication } from "../features/auth/guard";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: ({ context, location }) => requireAuthentication(context.queryClient, location.href),
  component: AuthenticatedLayout,
});
