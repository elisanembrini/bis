import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { INSTALL_DISMISSED_KEY } from "./dismissal";
import type { InstallPromptEvent } from "./install";
import { listenForInstall, useInstallStore } from "./installStore";

const fakePromptEvent = (outcome: "accepted" | "dismissed") => {
  const prompt = vi.fn<() => Promise<void>>(() => Promise.resolve());
  const event = Object.assign(new Event("beforeinstallprompt", { cancelable: true }), {
    prompt,
    userChoice: Promise.resolve({ outcome }),
  });
  return { event: event satisfies InstallPromptEvent, prompt };
};

beforeEach(() => {
  window.localStorage.clear();
  useInstallStore.setState({ promptEvent: null, installed: false, dismissed: false });
});

afterEach(() => {
  window.localStorage.clear();
});

describe("useInstallStore", () => {
  it("installs through the captured prompt and clears it", async () => {
    const { event, prompt } = fakePromptEvent("accepted");
    useInstallStore.getState().capture(event);

    await useInstallStore.getState().install();

    expect(prompt).toHaveBeenCalledOnce();
    expect(useInstallStore.getState().promptEvent).toBeNull();
    expect(useInstallStore.getState().installed).toBe(true);
  });

  it("stays not installed when the person declines the prompt", async () => {
    const { event } = fakePromptEvent("dismissed");
    useInstallStore.getState().capture(event);

    await useInstallStore.getState().install();

    expect(useInstallStore.getState().installed).toBe(false);
    expect(useInstallStore.getState().promptEvent).toBeNull();
  });

  it("does nothing without a captured prompt", async () => {
    await useInstallStore.getState().install();

    expect(useInstallStore.getState().installed).toBe(false);
  });

  it("remembers the dismissal", () => {
    useInstallStore.getState().dismiss();

    expect(useInstallStore.getState().dismissed).toBe(true);
    expect(window.localStorage.getItem(INSTALL_DISMISSED_KEY)).toBe("true");
  });
});

describe("listenForInstall", () => {
  it("captures the browser prompt and cancels its default banner", () => {
    const target = new EventTarget();
    listenForInstall(target);
    const { event } = fakePromptEvent("accepted");

    target.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
    expect(useInstallStore.getState().promptEvent).toBe(event);
  });

  it("marks the app as installed on appinstalled", () => {
    const target = new EventTarget();
    listenForInstall(target);
    const { event } = fakePromptEvent("accepted");
    target.dispatchEvent(event);

    target.dispatchEvent(new Event("appinstalled"));

    expect(useInstallStore.getState().installed).toBe(true);
    expect(useInstallStore.getState().promptEvent).toBeNull();
  });
});
