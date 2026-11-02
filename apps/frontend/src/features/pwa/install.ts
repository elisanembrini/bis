export type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export type InstallMode = "prompt" | "ios";

export type PlatformInfo = {
  userAgent: string;
  platform: string;
  maxTouchPoints: number;
};

export type InstallContext = {
  promptAvailable: boolean;
  ios: boolean;
  standalone: boolean;
  installed: boolean;
  dismissed: boolean;
};

export const isInstallPromptEvent = (event: Event): event is InstallPromptEvent =>
  "prompt" in event && typeof event.prompt === "function";

export const isIosDevice = ({ userAgent, platform, maxTouchPoints }: PlatformInfo): boolean =>
  /iPhone|iPad|iPod/.test(userAgent) || (platform === "MacIntel" && maxTouchPoints > 1);

export const isStandaloneDisplay = (
  matchesStandalone: boolean,
  navigatorStandalone: boolean | undefined,
): boolean => matchesStandalone || navigatorStandalone === true;

export const installMode = ({
  promptAvailable,
  ios,
  standalone,
  installed,
  dismissed,
}: InstallContext): InstallMode | null => {
  if (installed || dismissed || standalone) {
    return null;
  }
  if (promptAvailable) {
    return "prompt";
  }
  return ios ? "ios" : null;
};
