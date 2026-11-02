import { PageContainer } from "../../../components/PageContainer";
import { useInstallStore } from "../installStore";
import { useInstallMode } from "../useInstallMode";
import { InstallBanner } from "./InstallBanner";

export function InstallPrompt() {
  const mode = useInstallMode();
  const install = useInstallStore((state) => state.install);
  const dismiss = useInstallStore((state) => state.dismiss);

  if (mode === null) {
    return null;
  }

  return (
    <PageContainer>
      <InstallBanner mode={mode} onInstall={() => void install()} onDismiss={dismiss} />
    </PageContainer>
  );
}
