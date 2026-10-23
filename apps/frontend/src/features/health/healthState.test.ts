import { describe, expect, it } from "vitest";

import { toHealthState } from "./healthState";

describe("toHealthState", () => {
  it("returns loading while the request is pending", () => {
    expect(toHealthState({ isPending: true, isError: false })).toBe("loading");
  });

  it("returns error when the request failed", () => {
    expect(toHealthState({ isPending: false, isError: true })).toBe("error");
  });

  it("returns ok when the request succeeded", () => {
    expect(toHealthState({ isPending: false, isError: false })).toBe("ok");
  });
});
