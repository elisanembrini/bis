import { Stack, Text } from "@mantine/core";
import type { ReactNode } from "react";

import { GridPaper } from "./GridPaper";
import { HandwrittenTitle } from "./HandwrittenTitle";

type EmptyStateProps = {
  title: string;
  description?: string | undefined;
  action?: ReactNode;
};

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <GridPaper p="xl" bd="1px solid var(--bis-color-quadretti)" bdrs="md">
      <Stack gap="sm" align="flex-start">
        <HandwrittenTitle order={2} size={24}>
          {title}
        </HandwrittenTitle>
        {description !== undefined && <Text c="dimmed">{description}</Text>}
        {action}
      </Stack>
    </GridPaper>
  );
}
