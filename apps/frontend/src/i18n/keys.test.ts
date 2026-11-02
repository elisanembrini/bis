import { describe, expect, it } from "vitest";

import { compareKeys, flattenKeys } from "./keys";
import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES, isLanguage } from "./languages";
import { resources } from "./resources";

describe("flattenKeys", () => {
  it("lists nested keys and treats arrays as a single value", () => {
    expect(flattenKeys({ a: { b: "x", c: ["one", "two"] }, d: "y" })).toEqual(["a.b", "a.c", "d"]);
  });
});

describe("compareKeys", () => {
  const reference = { title: "Titolo", item_one: "uno", item_other: "altri", nested: { ok: "ok" } };

  it("finds nothing when the languages have the same keys", () => {
    expect(
      compareKeys(reference, { title: "Title", item_one: "one", nested: { ok: "ok" } }),
    ).toEqual({ missing: [], extra: [] });
  });

  it("reports missing and extra keys", () => {
    expect(compareKeys(reference, { title: "Title", unexpected: "x" })).toEqual({
      missing: ["item", "nested.ok"],
      extra: ["unexpected"],
    });
  });

  it("does not require the same plural forms in every language", () => {
    expect(
      compareKeys({ day_one: "giorno", day_other: "giorni" }, { day_few: "x", day_many: "y" }),
    ).toEqual({
      missing: [],
      extra: [],
    });
  });
});

describe("translations", () => {
  it("has a translation for the default language", () => {
    expect(isLanguage(DEFAULT_LANGUAGE)).toBe(true);
    expect(Object.keys(resources)).toContain(DEFAULT_LANGUAGE);
  });

  it.each(SUPPORTED_LANGUAGES)("%s has exactly the keys of the default language", (language) => {
    expect(compareKeys(resources[DEFAULT_LANGUAGE], resources[language])).toEqual({
      missing: [],
      extra: [],
    });
  });
});
