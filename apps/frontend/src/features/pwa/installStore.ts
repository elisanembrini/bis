import { create } from "zustand";

import { readInstallDismissed, storeInstallDismissed } from "./dismissal";
import { type InstallPromptEvent, isInstallPromptEvent } from "./install";

type InstallState = {
  promptEvent: InstallPromptEvent | null;
  installed: boolean;
  dismissed: boolean;
  capture: (event: InstallPromptEvent) => void;
  markInstalled: () => void;
  dismiss: () => void;
  install: () => Promise<void>;
};

export const useInstallStore = create<InstallState>()((set, get) => ({
  promptEvent: null,
  installed: false,
  dismissed: readInstallDismissed(),
  capture: (event) => set({ promptEvent: event }),
  markInstalled: () => set({ installed: true, promptEvent: null }),
  dismiss: () => {
    storeInstallDismissed();
    set({ dismissed: true });
  },
  install: async () => {
    const { promptEvent } = get();
    if (promptEvent === null) {
      return;
    }
    set({ promptEvent: null });
    await promptEvent.prompt();
    const { outcome } = await promptEvent.userChoice;
    if (outcome === "accepted") {
      set({ installed: true });
    }
  },
}));

export const listenForInstall = (target: EventTarget): void => {
  target.addEventListener("beforeinstallprompt", (event) => {
    if (isInstallPromptEvent(event)) {
      event.preventDefault();
      useInstallStore.getState().capture(event);
    }
  });
  target.addEventListener("appinstalled", () => {
    useInstallStore.getState().markInstalled();
  });
};
