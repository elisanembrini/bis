import { Alert, Button, PasswordInput, Stack } from "@mantine/core";
import { hasLength, useForm } from "@mantine/form";
import { useTranslation } from "react-i18next";

import type { AppErrorCode } from "../../../api/errors";
import { AnchorLink } from "../../../components/AnchorLink";
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "../constants";
import type { NewPasswordValues } from "../types";
import { FormError } from "./FormError";

type ResetPasswordFormProps = {
  onSubmit: (values: NewPasswordValues) => void;
  isSubmitting?: boolean;
  isDone?: boolean;
  errorCode?: AppErrorCode | undefined;
};

export function ResetPasswordForm({
  onSubmit,
  isSubmitting = false,
  isDone = false,
  errorCode,
}: ResetPasswordFormProps) {
  const { t } = useTranslation("auth");
  const form = useForm<NewPasswordValues>({
    mode: "uncontrolled",
    initialValues: { password: "" },
    validate: {
      password: hasLength(
        { min: PASSWORD_MIN_LENGTH, max: PASSWORD_MAX_LENGTH },
        t("validation.passwordLength", { min: PASSWORD_MIN_LENGTH, max: PASSWORD_MAX_LENGTH }),
      ),
    },
  });

  if (isDone) {
    return (
      <Stack gap="md">
        <Alert color="green" title={t("resetPassword.success")} />
        <AnchorLink to="/login">{t("resetPassword.goToLogin")}</AnchorLink>
      </Stack>
    );
  }

  return (
    <form noValidate onSubmit={form.onSubmit((values) => onSubmit(values))}>
      <Stack gap="md">
        <FormError code={errorCode} />
        {errorCode === "RESET_TOKEN_INVALID" && (
          <AnchorLink to="/forgot-password" size="sm">
            {t("resetPassword.requestNew")}
          </AnchorLink>
        )}
        <PasswordInput
          label={t("fields.newPassword")}
          description={t("register.passwordHint", { min: PASSWORD_MIN_LENGTH })}
          autoComplete="new-password"
          key={form.key("password")}
          {...form.getInputProps("password")}
        />
        <Button type="submit" loading={isSubmitting}>
          {t("resetPassword.submit")}
        </Button>
      </Stack>
    </form>
  );
}
