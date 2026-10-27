import { Stack } from "@mantine/core";
import { useTranslation } from "react-i18next";

import { $api } from "../../../api/client";
import { errorCodeOf } from "../../../api/errors";
import { AnchorLink } from "../../../components/AnchorLink";
import { ErrorMessage } from "../../../components/Messages";
import { AuthPageLayout } from "./AuthPageLayout";
import { ResetPasswordForm } from "./ResetPasswordForm";

type ResetPasswordPageProps = {
  token: string | undefined;
};

export function ResetPasswordPage({ token }: ResetPasswordPageProps) {
  const { t } = useTranslation("auth");
  const resetPassword = $api.useMutation("post", "/auth/reset-password");

  return (
    <AuthPageLayout title={t("resetPassword.title")}>
      {token === undefined ? (
        <Stack gap="md">
          <ErrorMessage title={t("resetPassword.missingToken")} />
          <AnchorLink to="/forgot-password">{t("resetPassword.requestNew")}</AnchorLink>
        </Stack>
      ) : (
        <ResetPasswordForm
          onSubmit={({ password }) => resetPassword.mutate({ body: { token, password } })}
          isSubmitting={resetPassword.isPending}
          isDone={resetPassword.isSuccess}
          errorCode={resetPassword.isError ? errorCodeOf(resetPassword.error) : undefined}
        />
      )}
    </AuthPageLayout>
  );
}
