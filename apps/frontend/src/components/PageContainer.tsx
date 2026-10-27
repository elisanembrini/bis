import { Box, Container } from "@mantine/core";
import type { ReactNode } from "react";

const GUTTER_PHONE = 20;
const GUTTER_TABLET = 32;

type PageContainerProps = {
  children: ReactNode;
};

export function PageContainer({ children }: PageContainerProps) {
  return (
    <Container size="sm" px={{ base: GUTTER_PHONE, sm: GUTTER_TABLET }} py="lg">
      {children}
    </Container>
  );
}

export function FullBleed({ children }: PageContainerProps) {
  return <Box mx={{ base: -GUTTER_PHONE, sm: -GUTTER_TABLET }}>{children}</Box>;
}
