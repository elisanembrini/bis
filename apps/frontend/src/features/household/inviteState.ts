import type { HouseholdResponse } from "./types";

export type InviteState =
  | { kind: "anonymous" }
  | { kind: "canJoin" }
  | { kind: "mustLeave" }
  | { kind: "alreadyMember" };

type InviteStateInput = {
  inviteHouseholdId: string;
  currentHousehold: HouseholdResponse | undefined;
};

export const inviteState = ({
  inviteHouseholdId,
  currentHousehold,
}: InviteStateInput): InviteState => {
  if (currentHousehold === undefined) {
    return { kind: "anonymous" };
  }
  if (currentHousehold.id === inviteHouseholdId) {
    return { kind: "alreadyMember" };
  }
  if (currentHousehold.members.length > 1) {
    return { kind: "mustLeave" };
  }
  return { kind: "canJoin" };
};
