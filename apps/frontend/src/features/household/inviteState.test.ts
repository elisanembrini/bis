import { describe, expect, it } from "vitest";

import { inviteState } from "./inviteState";
import type { HouseholdResponse } from "./types";

const member = (user_id: string, role: "owner" | "member") => ({
  user_id,
  display_name: user_id,
  role,
  joined_at: "2026-01-01T00:00:00Z",
});

const household = (id: string, size: number): HouseholdResponse => ({
  id,
  role: "owner",
  members: Array.from({ length: size }, (_, index) =>
    member(`user-${index}`, index === 0 ? "owner" : "member"),
  ),
});

describe("inviteState", () => {
  it("asks anonymous visitors to sign in", () => {
    expect(inviteState({ inviteHouseholdId: "h1", currentHousehold: undefined })).toEqual({
      kind: "anonymous",
    });
  });

  it("recognises members of the inviting household", () => {
    expect(inviteState({ inviteHouseholdId: "h1", currentHousehold: household("h1", 2) })).toEqual({
      kind: "alreadyMember",
    });
  });

  it("requires leaving a household shared with others", () => {
    expect(inviteState({ inviteHouseholdId: "h1", currentHousehold: household("h2", 2) })).toEqual({
      kind: "mustLeave",
    });
  });

  it("lets a user alone in their household join", () => {
    expect(inviteState({ inviteHouseholdId: "h1", currentHousehold: household("h2", 1) })).toEqual({
      kind: "canJoin",
    });
  });
});
