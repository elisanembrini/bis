import type { HouseholdMember } from "../types";

export const ownerMember: HouseholdMember = {
  user_id: "11111111-1111-4111-8111-111111111111",
  display_name: "Anna",
  role: "owner",
  joined_at: "2026-01-01T10:00:00Z",
};

export const regularMember: HouseholdMember = {
  user_id: "22222222-2222-4222-8222-222222222222",
  display_name: "Bruno",
  role: "member",
  joined_at: "2026-02-01T10:00:00Z",
};
