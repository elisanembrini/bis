import { Center, Container, Paper, Stack, Title } from "@mantine/core";
import type { ReactNode } from "react";

import { GridPaper } from "../../../components/GridPaper";
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
        </Stack>
      </Container>
    </GridPaper>
  );
}
