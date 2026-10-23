import { describe, expect, it } from "vitest";

import { errorCodeOf } from "./errors";

describe("errorCodeOf", () => {
  it("returns the code of an API error body", () => {
    expect(errorCodeOf({ code: "INVALID_CREDENTIALS", message: "x" })).toBe("INVALID_CREDENTIALS");
  });

  it("returns UNKNOWN for unknown codes", () => {
    expect(errorCodeOf({ code: "SOMETHING_ELSE" })).toBe("UNKNOWN");
  });

  it("returns UNKNOWN for validation errors and network failures", () => {
    expect(errorCodeOf({ detail: [] })).toBe("UNKNOWN");
    expect(errorCodeOf(new TypeError("Failed to fetch"))).toBe("UNKNOWN");
    expect(errorCodeOf(undefined)).toBe("UNKNOWN");
  });
});
