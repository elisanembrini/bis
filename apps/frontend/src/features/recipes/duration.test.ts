import { describe, expect, it } from "vitest";

import { durationParts, joinTimer, splitTimer } from "./duration";

describe("durationParts", () => {
  it("splits seconds into hours, minutes and seconds", () => {
    expect(durationParts(4530)).toEqual({ hours: 1, minutes: 15, seconds: 30 });
    expect(durationParts(45)).toEqual({ hours: 0, minutes: 0, seconds: 45 });
  });
});

describe("splitTimer and joinTimer", () => {
  it("round-trips minutes and seconds", () => {
    expect(splitTimer(90)).toEqual({ minutes: "1", seconds: "30" });
    expect(joinTimer("1", "30")).toBe(90);
  });

  it("treats an empty timer as no timer", () => {
    expect(splitTimer(null)).toEqual({ minutes: "", seconds: "" });
    expect(joinTimer("", "")).toBeNull();
    expect(joinTimer("0", "0")).toBeNull();
  });

  it("accepts seconds only", () => {
    expect(joinTimer("", "30")).toBe(30);
  });
});
