import { Button, Group, PasswordInput, Stack, Text, TextInput } from "@mantine/core";
import { hasLength, isEmail, isNotEmpty, useForm } from "@mantine/form";
import { useTranslation } from "react-i18next";

import type { AppErrorCode } from "../../../api/errors";
import { AnchorLink } from "../../../components/AnchorLink";
import { FormError } from "../../../components/FormError";
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "../constants";
import type { RegisterRequest } from "../types";

type RegisterFormProps = {
  onSubmit: (values: RegisterRequest) => void;
  isSubmitting?: boolean;
  errorCode?: AppErrorCode | undefined;
};

export function RegisterForm({ onSubmit, isSubmitting = false, errorCode }: RegisterFormProps) {
  const { t } = useTranslation("auth");
  const form = useForm<RegisterRequest>({
    mode: "uncontrolled",
    initialValues: { display_name: "", email: "", password: "" },
    validate: {
      display_name: isNotEmpty(t("validation.displayNameRequired")),
      email: isEmail(t("validation.emailInvalid")),
      password: hasLength(
        { min: PASSWORD_MIN_LENGTH, max: PASSWORD_MAX_LENGTH },
        t("validation.passwordLength", { min: PASSWORD_MIN_LENGTH, max: PASSWORD_MAX_LENGTH }),
      ),
    },
  });

  return (
    <form noValidate onSubmit={form.onSubmit((values) => onSubmit(values))}>
      <Stack gap="md">
        <FormError code={errorCode} />
        <TextInput
          label={t("fields.displayName")}
          autoComplete="given-name"
          key={form.key("display_name")}
          {...form.getInputProps("display_name")}
        />
        <TextInput
          label={t("fields.email")}
          type="email"
          autoComplete="email"
          key={form.key("email")}
          {...form.getInputProps("email")}
        />
        <PasswordInput
          label={t("fields.password")}
          description={t("register.passwordHint", { min: PASSWORD_MIN_LENGTH })}
          autoComplete="new-password"
          key={form.key("password")}
          {...form.getInputProps("password")}
        />
        <Button type="submit" loading={isSubmitting}>
          {t("register.submit")}
        </Button>
        <Group gap="xs">
          <Text size="sm">{t("register.hasAccount")}</Text>
          <AnchorLink to="/login" size="sm">
            {t("register.login")}
          </AnchorLink>
        </Group>
      </Stack>
    </form>
  );
}
