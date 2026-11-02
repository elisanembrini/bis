import { afterEach, describe, expect, it, vi } from "vitest";

import { LANGUAGE_STORAGE_KEY } from "./languages";
import { readStoredLanguage, storeLanguage } from "./storage";

afterEach(() => {
  window.localStorage.clear();
  vi.restoreAllMocks();
});

describe("stored language", () => {
  it("reads back a supported language", () => {
    storeLanguage("it");

    expect(window.localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe("it");
    expect(readStoredLanguage()).toBe("it");
  });

  it("ignores a missing or unsupported value", () => {
    expect(readStoredLanguage()).toBeUndefined();

    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, "xx");

    expect(readStoredLanguage()).toBeUndefined();
  });

  it("works when the storage is not available", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });

    expect(readStoredLanguage()).toBeUndefined();
    expect(() => storeLanguage("it")).not.toThrow();
  });
});
