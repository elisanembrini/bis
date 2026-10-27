import { describe, expect, it } from "vitest";

import { googleAuthorizeHref } from "./google";

describe("googleAuthorizeHref", () => {
  it("points to the backend authorize endpoint", () => {
    expect(googleAuthorizeHref()).toBe("/api/auth/google/authorize");
  });

  it("encodes the redirect path", () => {
    expect(googleAuthorizeHref({ redirect: "/ricette?q=pasta e fagioli" })).toBe(
      "/api/auth/google/authorize?redirect=%2Fricette%3Fq%3Dpasta+e+fagioli",
    );
  });

  it("carries the invite token through the Google flow", () => {
    expect(googleAuthorizeHref({ inviteToken: "abc-123" })).toBe(
      "/api/auth/google/authorize?invite_token=abc-123",
    );
  });
});
