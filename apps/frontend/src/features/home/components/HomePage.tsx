import { Container, Loader, Stack, Text, Title } from "@mantine/core";
import { useTranslation } from "react-i18next";

import { useMe } from "../../auth/hooks/useMe";

export function HomePage() {
  const { t } = useTranslation("home");
  const me = useMe();

  if (me.isPending) {
    return <Loader />;
  }
  if (me.isError) {
    return null;
  }

  return (
    <Container size="sm">
      <Stack gap="sm">
        <Title order={1}>{t("greeting", { name: me.data.display_name })}</Title>
        <Text>{t("intro")}</Text>
      </Stack>
    </Container>
  );
}
