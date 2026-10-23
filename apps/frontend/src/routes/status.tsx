import { createFileRoute } from "@tanstack/react-router";

import { HealthErrorPage, HealthPage } from "../features/health/components/HealthPage";
import { healthQueryOptions } from "../features/health/hooks/useHealth";

export const Route = createFileRoute("/status")({
  loader: ({ context }) => context.queryClient.ensureQueryData(healthQueryOptions()),
  component: HealthPage,
  errorComponent: HealthErrorPage,
});
