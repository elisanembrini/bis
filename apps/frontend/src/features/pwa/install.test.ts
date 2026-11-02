import { describe, expect, it } from "vitest";

import {
  type InstallContext,
  installMode,
  isInstallPromptEvent,
  isIosDevice,
  isStandaloneDisplay,
} from "./install";

const context = (overrides: Partial<InstallContext> = {}): InstallContext => ({
  promptAvailable: false,
  ios: false,
  standalone: false,
  installed: false,
  dismissed: false,
  ...overrides,
});

describe("isIosDevice", () => {
  it("recognizes iPhone and iPad user agents", () => {
    expect(
      isIosDevice({
        userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0)",
        platform: "iPhone",
        maxTouchPoints: 5,
      }),
    ).toBe(true);
    expect(
      isIosDevice({
        userAgent: "Mozilla/5.0 (iPad; CPU OS 18_0)",
        platform: "iPad",
        maxTouchPoints: 5,
      }),
    ).toBe(true);
  });

  it("recognizes an iPad that reports itself as a Mac", () => {
    expect(
      isIosDevice({
        userAgent: "Mozilla/5.0 (Macintosh)",
        platform: "MacIntel",
        maxTouchPoints: 5,
      }),
    ).toBe(true);
  });

  it("does not match a Mac without touch or an Android phone", () => {
    expect(
      isIosDevice({
        userAgent: "Mozilla/5.0 (Macintosh)",
        platform: "MacIntel",
        maxTouchPoints: 0,
      }),
    ).toBe(false);
    expect(
      isIosDevice({
        userAgent: "Mozilla/5.0 (Linux; Android 15)",
        platform: "Linux armv8l",
        maxTouchPoints: 5,
      }),
    ).toBe(false);
  });
});

describe("isStandaloneDisplay", () => {
  it("is true when either signal says standalone", () => {
    expect(isStandaloneDisplay(true, undefined)).toBe(true);
    expect(isStandaloneDisplay(false, true)).toBe(true);
  });

  it("is false otherwise", () => {
    expect(isStandaloneDisplay(false, undefined)).toBe(false);
    expect(isStandaloneDisplay(false, false)).toBe(false);
  });
});

describe("installMode", () => {
  it("offers the native prompt when the browser provides one", () => {
    expect(installMode(context({ promptAvailable: true }))).toBe("prompt");
  });

  it("shows the manual instructions on iOS", () => {
    expect(installMode(context({ ios: true }))).toBe("ios");
  });

  it("shows nothing on browsers that cannot install", () => {
    expect(installMode(context())).toBeNull();
  });

  it.each([{ installed: true }, { dismissed: true }, { standalone: true }])(
    "shows nothing when %o",
    (overrides) => {
      expect(installMode(context({ promptAvailable: true, ios: true, ...overrides }))).toBeNull();
    },
  );
});

describe("isInstallPromptEvent", () => {
  it("accepts an event that has a prompt function", () => {
    const event = Object.assign(new Event("beforeinstallprompt"), {
      prompt: () => Promise.resolve(),
    });
    expect(isInstallPromptEvent(event)).toBe(true);
  });

  it("rejects a plain event", () => {
    expect(isInstallPromptEvent(new Event("beforeinstallprompt"))).toBe(false);
  });
});
