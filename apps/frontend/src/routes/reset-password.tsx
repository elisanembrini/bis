import { createFileRoute } from "@tanstack/react-router";

import { ResetPasswordPage } from "../features/auth/components/ResetPasswordPage";

type ResetPasswordSearch = { token?: string };

export const Route = createFileRoute("/reset-password")({
  validateSearch: (search: Record<string, unknown>): ResetPasswordSearch => {
    const token = search["token"];
    return typeof token === "string" && token.length > 0 ? { token } : {};
  },
  component: ResetPasswordRoute,
});

function ResetPasswordRoute() {
  const { token } = Route.useSearch();
  return <ResetPasswordPage token={token} />;
}
