import { describe, expect, it } from "vitest";

import { formatDate } from "./formatDate";

describe("formatDate", () => {
  it("formats an ISO date in the requested language", () => {
    expect(formatDate("2026-10-30T12:00:00Z", "it", "Europe/Rome")).toBe("30 ottobre 2026");
    expect(formatDate("2026-10-30T12:00:00Z", "en", "Europe/Rome")).toBe("October 30, 2026");
  });

  it("uses the requested time zone near midnight", () => {
    expect(formatDate("2026-10-30T23:30:00Z", "it", "Europe/Rome")).toBe("31 ottobre 2026");
    expect(formatDate("2026-10-30T23:30:00Z", "it", "UTC")).toBe("30 ottobre 2026");
  });

  it("follows the active language by default", () => {
    expect(formatDate("2026-10-30T12:00:00Z", undefined, "UTC")).toBe("30 ottobre 2026");
  });
});
