import { Title } from "@mantine/core";
import type { ReactNode } from "react";

type SectionTitleProps = {
  children: ReactNode;
};

export function SectionTitle({ children }: SectionTitleProps) {
  return (
    <Title order={2} fz="lg" fw={600}>
      {children}
    </Title>
  );
}
