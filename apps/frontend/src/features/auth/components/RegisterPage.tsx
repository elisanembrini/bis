import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { $api } from "../../../api/client";
import { errorCodeOf } from "../../../api/errors";
import { meQueryOptions } from "../queries";
import { AuthPageLayout } from "./AuthPageLayout";
import { GoogleSignInButton } from "./GoogleSignInButton";
import { OrDivider } from "./OrDivider";
import { RegisterForm } from "./RegisterForm";

export function RegisterPage() {
  const { t } = useTranslation("auth");
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const register = $api.useMutation("post", "/auth/register", {
    onSuccess: (me) => {
      queryClient.setQueryData(meQueryOptions().queryKey, me);
      void navigate({ to: "/" });
    },
  });

  return (
    <AuthPageLayout title={t("register.title")}>
      <GoogleSignInButton />
      <OrDivider />
      <RegisterForm
        onSubmit={(body) => register.mutate({ body })}
        isSubmitting={register.isPending}
        errorCode={register.isError ? errorCodeOf(register.error) : undefined}
      />
    </AuthPageLayout>
  );
}
