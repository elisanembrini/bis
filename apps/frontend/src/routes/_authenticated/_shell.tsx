import { createFileRoute } from "@tanstack/react-router";

import { AuthenticatedLayout } from "../../features/auth/components/AuthenticatedLayout";

export const Route = createFileRoute("/_authenticated/_shell")({
  component: AuthenticatedLayout,
});
