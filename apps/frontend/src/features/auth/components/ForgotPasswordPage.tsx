import { useTranslation } from "react-i18next";

import { $api } from "../../../api/client";
import { errorCodeOf } from "../../../api/errors";
import { AuthPageLayout } from "./AuthPageLayout";
import { ForgotPasswordForm } from "./ForgotPasswordForm";

export function ForgotPasswordPage() {
  const { t } = useTranslation("auth");
  const forgotPassword = $api.useMutation("post", "/auth/forgot-password");

  return (
    <AuthPageLayout title={t("forgotPassword.title")}>
      <ForgotPasswordForm
        onSubmit={(body) => forgotPassword.mutate({ body })}
        isSubmitting={forgotPassword.isPending}
        isSent={forgotPassword.isSuccess}
        errorCode={forgotPassword.isError ? errorCodeOf(forgotPassword.error) : undefined}
      />
    </AuthPageLayout>
  );
}
