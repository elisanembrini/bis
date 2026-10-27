import { Container, Paper } from "@mantine/core";
import type { ReactNode } from "react";

export function InviteLayout({ children }: { children: ReactNode }) {
  return (
    <Container size="xs" py="xl">
      <Paper withBorder p="lg">
        {children}
      </Paper>
    </Container>
  );
}
