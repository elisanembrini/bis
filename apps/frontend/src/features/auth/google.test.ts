import { describe, expect, it } from "vitest";

import { googleAuthorizeHref } from "./google";

describe("googleAuthorizeHref", () => {
  it("points to the backend authorize endpoint", () => {
    expect(googleAuthorizeHref(undefined)).toBe("/api/auth/google/authorize");
  });

  it("encodes the redirect path", () => {
    expect(googleAuthorizeHref("/ricette?q=pasta e fagioli")).toBe(
      "/api/auth/google/authorize?redirect=%2Fricette%3Fq%3Dpasta+e+fagioli",
    );
  });
});
