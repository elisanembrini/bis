import { AppShell, Button, Group, Title } from "@mantine/core";
import { Outlet } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { useLogout } from "../hooks/useLogout";

export function AuthenticatedLayout() {
  const { t } = useTranslation();
  const { t: tAuth } = useTranslation("auth");
  const logout = useLogout();

  return (
    <AppShell header={{ height: 56 }} padding="md">
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Title order={2} size="h4">
            {t("appName")}
          </Title>
          <Button variant="subtle" loading={logout.isPending} onClick={() => logout.mutate({})}>
            {tAuth("logout")}
          </Button>
        </Group>
      </AppShell.Header>
      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}
