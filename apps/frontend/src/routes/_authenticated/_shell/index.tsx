import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/_shell/")({
  beforeLoad: () => {
    throw redirect({ to: "/recipes" });
  },
});
