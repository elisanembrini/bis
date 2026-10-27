import { createFileRoute } from "@tanstack/react-router";

import { TagsPage } from "../../../features/tags/components/TagsPage";
import { tagsQueryOptions } from "../../../features/tags/queries";

export const Route = createFileRoute("/_authenticated/_shell/tags")({
  loader: ({ context }) => context.queryClient.ensureQueryData(tagsQueryOptions()),
  component: TagsPage,
});
