import { useState } from "react";

import { type InstallMode, installMode, isIosDevice, isStandaloneDisplay } from "./install";
import { useInstallStore } from "./installStore";

const detectEnvironment = () => ({
  ios: isIosDevice({
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    maxTouchPoints: navigator.maxTouchPoints,
  }),
  standalone: isStandaloneDisplay(
    window.matchMedia("(display-mode: standalone)").matches,
    "standalone" in navigator && typeof navigator.standalone === "boolean"
      ? navigator.standalone
      : undefined,
  ),
});

export const useInstallMode = (): InstallMode | null => {
  const [environment] = useState(detectEnvironment);
  const promptAvailable = useInstallStore((state) => state.promptEvent !== null);
  const installed = useInstallStore((state) => state.installed);
  const dismissed = useInstallStore((state) => state.dismissed);

  return installMode({ promptAvailable, installed, dismissed, ...environment });
};
