import { Container } from "@mantine/core";

import { toHealthState } from "../healthState";
import { useHealth } from "../hooks/useHealth";
import { HealthStatus } from "./HealthStatus";

export function HealthPage() {
  const { isPending, isError } = useHealth();

  return (
    <Container size="sm" py="xl">
      <HealthStatus state={toHealthState({ isPending, isError })} />
    </Container>
  );
}

export function HealthErrorPage() {
  return (
    <Container size="sm" py="xl">
      <HealthStatus state="error" />
    </Container>
  );
}
