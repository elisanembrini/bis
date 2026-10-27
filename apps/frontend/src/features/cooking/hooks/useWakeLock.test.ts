import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useWakeLock } from "./useWakeLock";

type FakeSentinel = { released: boolean; release: () => Promise<void> };

const installWakeLock = () => {
  const sentinels: FakeSentinel[] = [];
  const request = vi.fn<() => Promise<FakeSentinel>>(() => {
    const sentinel: FakeSentinel = {
      released: false,
      release: vi.fn<() => Promise<void>>(() => {
        sentinel.released = true;
        return Promise.resolve();
      }),
    };
    sentinels.push(sentinel);
    return Promise.resolve(sentinel);
  });
  Object.defineProperty(navigator, "wakeLock", { value: { request }, configurable: true });
  return { request, sentinels };
};

const setVisibility = (state: DocumentVisibilityState) => {
  Object.defineProperty(document, "visibilityState", { value: state, configurable: true });
  document.dispatchEvent(new Event("visibilitychange"));
};

afterEach(() => {
  Reflect.deleteProperty(navigator, "wakeLock");
  Reflect.deleteProperty(document, "visibilityState");
});

describe("useWakeLock", () => {
  it("keeps the screen on while active and releases it on exit", async () => {
    const { request, sentinels } = installWakeLock();

    const { unmount } = renderHook(() => useWakeLock(true));
    await vi.waitFor(() => expect(sentinels).toHaveLength(1));

    expect(request).toHaveBeenCalledWith("screen");
    unmount();
    expect(sentinels[0]?.released).toBe(true);
  });

  it("asks again when the page becomes visible after being hidden", async () => {
    const { request, sentinels } = installWakeLock();
    renderHook(() => useWakeLock(true));
    await vi.waitFor(() => expect(sentinels).toHaveLength(1));

    const first = sentinels[0];
    if (first !== undefined) {
      first.released = true;
    }
    setVisibility("hidden");
    setVisibility("visible");

    await vi.waitFor(() => expect(request).toHaveBeenCalledTimes(2));
  });

  it("does nothing where the API is missing", () => {
    expect(() => renderHook(() => useWakeLock(true))).not.toThrow();
  });
});
