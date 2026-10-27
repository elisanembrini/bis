import { createFileRoute } from "@tanstack/react-router";

import { HouseholdPage } from "../../features/household/components/HouseholdPage";
import { householdQueryOptions } from "../../features/household/queries";

export const Route = createFileRoute("/_authenticated/household")({
  loader: ({ context }) => context.queryClient.ensureQueryData(householdQueryOptions()),
  component: HouseholdPage,
});
