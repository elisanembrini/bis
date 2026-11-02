import { afterEach, describe, expect, it } from "vitest";

import i18n, { selectLanguage } from "./index";
import { LANGUAGE_STORAGE_KEY } from "./languages";

afterEach(() => {
  window.localStorage.clear();
});

describe("i18n instance", () => {
  it("starts in Italian and sets the language of the page", () => {
    expect(i18n.language).toBe("it");
    expect(document.documentElement.lang).toBe("it");
  });

  it("remembers the language the user selects", async () => {
    await selectLanguage("it");

    expect(window.localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe("it");
    expect(document.documentElement.lang).toBe("it");
  });
});
