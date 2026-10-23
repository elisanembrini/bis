import { Button, Group, PasswordInput, Stack, TextInput } from "@mantine/core";
import { isEmail, isNotEmpty, useForm } from "@mantine/form";
import { useTranslation } from "react-i18next";

import type { AppErrorCode } from "../../../api/errors";
import { AnchorLink } from "../../../components/AnchorLink";
import type { LoginRequest } from "../types";
import { FormError } from "./FormError";

type LoginFormProps = {
  onSubmit: (values: LoginRequest) => void;
  isSubmitting?: boolean;
  errorCode?: AppErrorCode | undefined;
};

export function LoginForm({ onSubmit, isSubmitting = false, errorCode }: LoginFormProps) {
  const { t } = useTranslation("auth");
  const form = useForm<LoginRequest>({
    mode: "uncontrolled",
    initialValues: { email: "", password: "" },
    validate: {
      email: isEmail(t("validation.emailInvalid")),
      password: isNotEmpty(t("validation.passwordRequired")),
    },
  });

  return (
    <form noValidate onSubmit={form.onSubmit((values) => onSubmit(values))}>
      <Stack gap="md">
        <FormError code={errorCode} />
        <TextInput
          label={t("fields.email")}
          type="email"
          autoComplete="email"
          key={form.key("email")}
          {...form.getInputProps("email")}
        />
        <PasswordInput
          label={t("fields.password")}
          autoComplete="current-password"
          key={form.key("password")}
          {...form.getInputProps("password")}
        />
        <Button type="submit" loading={isSubmitting}>
          {t("login.submit")}
        </Button>
        <Group justify="space-between">
          <AnchorLink to="/forgot-password" size="sm">
            {t("login.forgotPassword")}
          </AnchorLink>
          <AnchorLink to="/register" size="sm">
            {t("login.register")}
          </AnchorLink>
        </Group>
      </Stack>
    </form>
  );
}
