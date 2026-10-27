import { Alert, Button, Stack, Text, TextInput } from "@mantine/core";
import { isEmail, useForm } from "@mantine/form";
import { useTranslation } from "react-i18next";

import type { AppErrorCode } from "../../../api/errors";
import { AnchorLink } from "../../../components/AnchorLink";
import { FormError } from "../../../components/FormError";
import type { ForgotPasswordRequest } from "../types";

type ForgotPasswordFormProps = {
  onSubmit: (values: ForgotPasswordRequest) => void;
  isSubmitting?: boolean;
  isSent?: boolean;
  errorCode?: AppErrorCode | undefined;
};

export function ForgotPasswordForm({
  onSubmit,
  isSubmitting = false,
  isSent = false,
  errorCode,
}: ForgotPasswordFormProps) {
  const { t } = useTranslation("auth");
  const form = useForm<ForgotPasswordRequest>({
    mode: "uncontrolled",
    initialValues: { email: "" },
    validate: { email: isEmail(t("validation.emailInvalid")) },
  });

  if (isSent) {
    return (
      <Stack gap="md">
        <Alert color="green" title={t("forgotPassword.sent")} />
        <AnchorLink to="/login" size="sm">
          {t("forgotPassword.backToLogin")}
        </AnchorLink>
      </Stack>
    );
  }

  return (
    <form noValidate onSubmit={form.onSubmit((values) => onSubmit(values))}>
      <Stack gap="md">
        <Text size="sm">{t("forgotPassword.description")}</Text>
        <FormError code={errorCode} />
        <TextInput
          label={t("fields.email")}
          type="email"
          autoComplete="email"
          key={form.key("email")}
          {...form.getInputProps("email")}
        />
        <Button type="submit" loading={isSubmitting}>
          {t("forgotPassword.submit")}
        </Button>
        <AnchorLink to="/login" size="sm">
          {t("forgotPassword.backToLogin")}
        </AnchorLink>
      </Stack>
    </form>
  );
}
