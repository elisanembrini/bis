import { describe, expect, it } from "vitest";

import { formatDate } from "./formatDate";

describe("formatDate", () => {
  it("formats an ISO date in Italian", () => {
    expect(formatDate("2026-10-30T12:00:00Z")).toBe("30 ottobre 2026");
  });

  it("uses the Italian time zone near midnight", () => {
    expect(formatDate("2026-10-30T23:30:00Z")).toBe("31 ottobre 2026");
  });
});
