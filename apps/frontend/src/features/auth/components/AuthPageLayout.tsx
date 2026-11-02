import { Center, Container, Paper, Stack, Title } from "@mantine/core";
import type { ReactNode } from "react";

import { GridPaper } from "../../../components/GridPaper";
import { LanguageSwitcher } from "../../../components/LanguageSwitcher";
import { LegalFooter } from "../../../components/LegalFooter";
import { Logo } from "../../../components/Logo";

type AuthPageLayoutProps = {
  title: string;
  children: ReactNode;
};

export function AuthPageLayout({ title, children }: AuthPageLayoutProps) {
  return (
    <GridPaper mih="100dvh">
      <Container size="xs" py="xl">
        <Stack gap="md">
          <LanguageSwitcher />
          <Center>
            <Logo width={128} />
          </Center>
          <Paper withBorder bg="white" p="lg">
            <Stack gap="lg">
              <Title order={1} size="h2">
                {title}
              </Title>
              {children}
            </Stack>
          </Paper>
          <LegalFooter />
        </Stack>
      </Container>
    </GridPaper>
  );
}
