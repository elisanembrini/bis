import { describe, expect, it } from "vitest";

import { isValidSourceUrl, parseWebAddress, sourceHost } from "./sourceLink";

describe("parseWebAddress", () => {
  it("parses http and https addresses", () => {
    expect(parseWebAddress("https://example.com/a")?.hostname).toBe("example.com");
    expect(parseWebAddress("  HTTP://example.com  ")?.hostname).toBe("example.com");
  });

  it("refuses other schemes and malformed values", () => {
    for (const value of [
      "javascript:alert(1)",
      "data:text/html,x",
      "mailto:a@b.it",
      "https://",
      "",
    ]) {
      expect(parseWebAddress(value)).toBeNull();
    }
  });
});

describe("isValidSourceUrl", () => {
  it("limits the length", () => {
    expect(isValidSourceUrl(`https://example.com/${"a".repeat(2000)}`)).toBe(true);
    expect(isValidSourceUrl(`https://example.com/${"a".repeat(2048)}`)).toBe(false);
  });
});

describe("sourceHost", () => {
  it("shows the domain without www", () => {
    expect(sourceHost("https://www.giallozafferano.it/ricetta")).toBe("giallozafferano.it");
    expect(sourceHost("http://blog.example.com/x")).toBe("blog.example.com");
  });

  it("returns null for an address that is not a web address", () => {
    expect(sourceHost("javascript:alert(1)")).toBeNull();
  });
});
