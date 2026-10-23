import { Container, Paper, Stack, Title } from "@mantine/core";
import type { ReactNode } from "react";

type AuthPageLayoutProps = {
  title: string;
  children: ReactNode;
};

export function AuthPageLayout({ title, children }: AuthPageLayoutProps) {
  return (
    <Container size="xs" py="xl">
      <Paper withBorder p="lg">
        <Stack gap="lg">
          <Title order={1}>{title}</Title>
          {children}
        </Stack>
      </Paper>
    </Container>
  );
}
