import { createFileRoute } from "@tanstack/react-router";

import { LoginPage } from "../features/auth/components/LoginPage";
import { validateRedirectSearch } from "../features/auth/redirect";

export const Route = createFileRoute("/login")({
  validateSearch: validateRedirectSearch,
  component: LoginRoute,
});

function LoginRoute() {
  const { redirect } = Route.useSearch();
  return <LoginPage redirect={redirect} />;
}
