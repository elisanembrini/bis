import { useQueryClient } from "@tanstack/react-query";
import { useNavigate, useRouter } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { $api } from "../../../api/client";
import { type ApiErrorCode, errorCodeOf } from "../../../api/errors";
import { meQueryOptions } from "../queries";
import { AuthPageLayout } from "./AuthPageLayout";
import { GoogleSignInButton } from "./GoogleSignInButton";
import { LoginForm } from "./LoginForm";
import { OrDivider } from "./OrDivider";

type LoginPageProps = {
  redirect: string | undefined;
  callbackError: ApiErrorCode | undefined;
};

export function LoginPage({ redirect, callbackError }: LoginPageProps) {
  const { t } = useTranslation("auth");
  const queryClient = useQueryClient();
  const router = useRouter();
  const navigate = useNavigate();
  const login = $api.useMutation("post", "/auth/login", {
    onSuccess: (me) => {
      queryClient.setQueryData(meQueryOptions().queryKey, me);
      if (redirect === undefined) {
        void navigate({ to: "/" });
      } else {
        router.history.push(redirect);
      }
    },
  });

  return (
    <AuthPageLayout title={t("login.title")}>
      <GoogleSignInButton redirect={redirect} />
      <OrDivider />
      <LoginForm
        onSubmit={(body) => login.mutate({ body })}
        isSubmitting={login.isPending}
        errorCode={login.isError ? errorCodeOf(login.error) : callbackError}
      />
    </AuthPageLayout>
  );
}
