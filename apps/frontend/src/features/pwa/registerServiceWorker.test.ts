import { afterEach, describe, expect, it, vi } from "vitest";

import { SERVICE_WORKER_URL, registerServiceWorker } from "./registerServiceWorker";

const installServiceWorker = () => {
  const register = vi.fn<(url: string) => Promise<unknown>>(() => Promise.resolve({}));
  Object.defineProperty(navigator, "serviceWorker", { value: { register }, configurable: true });
  return register;
};

afterEach(() => {
  vi.unstubAllEnvs();
  Reflect.deleteProperty(navigator, "serviceWorker");
});

describe("registerServiceWorker", () => {
  it("does not register outside production", () => {
    const register = installServiceWorker();

    registerServiceWorker();
    window.dispatchEvent(new Event("load"));

    expect(register).not.toHaveBeenCalled();
  });

  it("registers the worker once the page has loaded in production", () => {
    vi.stubEnv("PROD", true);
    const register = installServiceWorker();

    registerServiceWorker();
    expect(register).not.toHaveBeenCalled();
    window.dispatchEvent(new Event("load"));

    expect(register).toHaveBeenCalledWith(SERVICE_WORKER_URL);
  });

  it("does nothing when the browser has no service worker support", () => {
    vi.stubEnv("PROD", true);

    expect(() => registerServiceWorker()).not.toThrow();
  });
});
