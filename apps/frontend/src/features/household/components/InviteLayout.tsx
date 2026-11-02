import { Center, Container, Paper, Stack } from "@mantine/core";
import type { ReactNode } from "react";

import { GridPaper } from "../../../components/GridPaper";
import { LegalFooter } from "../../../components/LegalFooter";
import { Logo } from "../../../components/Logo";

export function InviteLayout({ children }: { children: ReactNode }) {
  return (
    <GridPaper mih="100dvh">
      <Container size="xs" py="xl">
        <Stack gap="md">
          <Center>
            <Logo width={128} />
          </Center>
          <Paper withBorder bg="white" p="lg">
            {children}
          </Paper>
          <LegalFooter />
        </Stack>
      </Container>
    </GridPaper>
  );
}
