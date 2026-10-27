import { Stack, Title } from "@mantine/core";
import { useTranslation } from "react-i18next";

import type { AppErrorCode } from "../../../api/errors";
import { AnchorLink } from "../../../components/AnchorLink";
import { FormError } from "../../../components/FormError";

type InviteInvalidProps = {
  code: AppErrorCode;
};

export function InviteInvalid({ code }: InviteInvalidProps) {
  const { t } = useTranslation("household");

  return (
    <Stack gap="md">
      <Title order={1} size="h2">
        {t("invitePage.title")}
      </Title>
      <FormError code={code} />
      <AnchorLink to="/">{t("invitePage.goToHome")}</AnchorLink>
    </Stack>
  );
}
