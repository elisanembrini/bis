import { describe, expect, it } from "vitest";

import { sanitizeRedirect, validateRedirectSearch } from "./redirect";

describe("sanitizeRedirect", () => {
  it("accepts internal paths with query string", () => {
    expect(sanitizeRedirect("/recipes?q=pasta")).toBe("/recipes?q=pasta");
  });

  it("rejects absolute and protocol-relative URLs", () => {
    expect(sanitizeRedirect("https://evil.example")).toBeUndefined();
    expect(sanitizeRedirect("//evil.example")).toBeUndefined();
    expect(sanitizeRedirect("/\\evil.example")).toBeUndefined();
  });

  it("rejects non-string values", () => {
    expect(sanitizeRedirect(42)).toBeUndefined();
    expect(sanitizeRedirect(undefined)).toBeUndefined();
  });
});

describe("validateRedirectSearch", () => {
  it("drops an unsafe redirect", () => {
    expect(validateRedirectSearch({ redirect: "//evil.example" })).toEqual({});
  });

  it("keeps a safe redirect", () => {
    expect(validateRedirectSearch({ redirect: "/" })).toEqual({ redirect: "/" });
  });
});
