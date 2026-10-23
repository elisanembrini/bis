import { createFileRoute } from "@tanstack/react-router";

import { LoginPage } from "../features/auth/components/LoginPage";
import { validateLoginSearch } from "../features/auth/redirect";

export const Route = createFileRoute("/login")({
  validateSearch: validateLoginSearch,
  component: LoginRoute,
});

function LoginRoute() {
  const { redirect, error } = Route.useSearch();
  return <LoginPage redirect={redirect} callbackError={error} />;
}
