import { $api } from "../../api/client";

export const meQueryOptions = () => $api.queryOptions("get", "/me");
