import { useTranslation } from "react-i18next";

import type { AppErrorCode } from "../api/errors";
import { ErrorMessage } from "./Messages";

type FormErrorProps = {
  code: AppErrorCode | undefined;
};

export function FormError({ code }: FormErrorProps) {
  const { t } = useTranslation();

  if (code === undefined) {
    return null;
  }
  return <ErrorMessage title={t(`errors.${code}`)} />;
}
