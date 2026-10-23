import { Alert } from "@mantine/core";
import { useTranslation } from "react-i18next";

import type { AppErrorCode } from "../../../api/errors";

type FormErrorProps = {
  code: AppErrorCode | undefined;
};

export function FormError({ code }: FormErrorProps) {
  const { t } = useTranslation("auth");

  if (code === undefined) {
    return null;
  }
  return <Alert color="red" title={t(`errors.${code}`)} />;
}
