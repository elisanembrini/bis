export const INSTALL_DISMISSED_KEY = "bis:install-dismissed";

export const readInstallDismissed = (): boolean => {
  try {
    return window.localStorage.getItem(INSTALL_DISMISSED_KEY) === "true";
  } catch {
    return false;
  }
};

export const storeInstallDismissed = (): void => {
  try {
    window.localStorage.setItem(INSTALL_DISMISSED_KEY, "true");
  } catch {
    return;
  }
};
