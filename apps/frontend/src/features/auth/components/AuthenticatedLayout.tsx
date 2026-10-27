import { AppShell, Button, Group } from "@mantine/core";
import { Outlet } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { AnchorLink } from "../../../components/AnchorLink";
import { Logo } from "../../../components/Logo";
import { useLogout } from "../hooks/useLogout";

const HEADER_HEIGHT = 84;

export function AuthenticatedLayout() {
  const { t } = useTranslation();
  const { t: tAuth } = useTranslation("auth");
  const logout = useLogout();

  return (
    <AppShell header={{ height: HEADER_HEIGHT }} padding={0}>
      <AppShell.Header>
        <Group h="100%" pr="md" justify="space-between" wrap="nowrap">
          <Group gap="md" wrap="nowrap">
            <AnchorLink to="/recipes">
              <Logo />
            </AnchorLink>
            <AnchorLink to="/recipes" fw={600}>
              {t("nav.recipes")}
            </AnchorLink>
            <AnchorLink to="/household" fw={600}>
              {t("nav.household")}
            </AnchorLink>
          </Group>
          <Button
            variant="subtle"
            color="inchiostro"
            loading={logout.isPending}
            onClick={() => logout.mutate({})}
          >
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
