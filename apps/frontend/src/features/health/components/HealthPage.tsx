import { PageContainer } from "../../../components/PageContainer";
import { toHealthState } from "../healthState";
import { useHealth } from "../hooks/useHealth";
import { HealthStatus } from "./HealthStatus";

export function HealthPage() {
  const { isPending, isError } = useHealth();

  return (
    <PageContainer>
      <HealthStatus state={toHealthState({ isPending, isError })} />
    </PageContainer>
  );
}

export function HealthErrorPage() {
  return (
    <PageContainer>
      <HealthStatus state="error" />
    </PageContainer>
  );
}
