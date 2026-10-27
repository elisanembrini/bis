import { $api } from "../../api/client";

export const householdQueryOptions = () => $api.queryOptions("get", "/household");

export const invitePreviewQueryOptions = (token: string) =>
  $api.queryOptions("get", "/household/invites/{token}", { params: { path: { token } } });
