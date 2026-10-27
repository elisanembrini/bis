import { createFileRoute } from "@tanstack/react-router";

import { RegisterPage } from "../features/auth/components/RegisterPage";

type RegisterSearch = { invite?: string };

export const Route = createFileRoute("/register")({
  validateSearch: (search: Record<string, unknown>): RegisterSearch => {
    const invite = search["invite"];
    return typeof invite === "string" && invite.length > 0 ? { invite } : {};
  },
  component: RegisterRoute,
});

function RegisterRoute() {
  const { invite } = Route.useSearch();
  return <RegisterPage inviteToken={invite} />;
}
