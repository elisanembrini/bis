import { Divider } from "@mantine/core";
import { useTranslation } from "react-i18next";

export function OrDivider() {
  const { t } = useTranslation("auth");

  return <Divider label={t("google.or")} labelPosition="center" />;
}
